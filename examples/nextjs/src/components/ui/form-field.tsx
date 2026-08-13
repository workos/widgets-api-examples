"use client";
import { CaretDownIcon, CalendarIcon, ClockIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import * as React from "react";
import clsx from "clsx";
import { useComposedRefs } from "@/lib/use-composed-refs";
import styles from "./form-field.module.css";
import { useLazyRef } from "@/lib/use-lazy-ref";

type FieldElementType = "input" | "textarea" | "select";
type SlotRefMap = Map<"left" | "right", Set<HTMLElement>>;
type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type InputType =
	| "date"
	| "datetime-local"
	| "email"
	| "hidden"
	| "month"
	| "number"
	| "password"
	| "search"
	| "tel"
	| "text"
	| "time"
	| "url"
	| "week";

interface TextFieldContextValue {
	slotRefs: React.RefObject<SlotRefMap>;
	inputRef: React.RefObject<FieldElement | null>;
	type: InputType | "select" | "textarea";
	invalid: boolean;
	disabled: boolean;
}

const TextFieldContext = React.createContext<TextFieldContextValue | null>(null);
TextFieldContext.displayName = "TextFieldContext";

function useFormFieldContext() {
	const context = React.use(TextFieldContext);
	if (!context) {
		throw new Error("useTextFieldContext must be used within a TextFieldRoot");
	}
	return context;
}

/**
 * A subset of HTML input types that visually resemble and behave like a text
 * field. Other input types (checkbox, radio, select, etc.) will have separate DS
 * components.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types
 */
type FormFieldType =
	| "text"
	| "email"
	| "password"
	| "number"
	| "date"
	| "time"
	| "datetime-local"
	| "month"
	| "week"
	| "tel"
	| "url"
	| "search";

interface SharedFormFieldProps {
	name: string;
	label: string;
	description?: string | null;
	visuallyHideLabel?: boolean;
	id?: string;
	left?: React.ReactNode;
	right?: React.ReactNode;
	value?: string;
	defaultValue?: string;
	invalid?: boolean;
	invalidText?: string | null;
	disabled?: boolean;
	readOnly?: boolean;
	placeholder?: string;
	required?: boolean;
	"aria-describedby"?: string;
	"aria-label"?: string;
	ref?: React.Ref<HTMLInputElement>;
}

type FormFieldProps<T extends FieldElementType = "input"> = SharedFormFieldProps &
	(T extends "select"
		? {
				type: "select";
				onChange?: React.ChangeEventHandler<HTMLSelectElement>;
				ref?: React.Ref<HTMLSelectElement>;
				options?: { label?: string; value: string; disabled?: boolean }[];
			}
		: T extends "textarea"
			? {
					type: "textarea";
					maxLength?: number;
					minLength?: number;
					rows?: number;
					onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
					ref?: React.Ref<HTMLTextAreaElement>;
					options?: never;
					inputMode?: React.HTMLAttributes<HTMLTextAreaElement>["inputMode"];
				}
			: {
					type?: FormFieldType;
					maxLength?: number;
					minLength?: number;
					min?: number;
					max?: number;
					onChange?: React.ChangeEventHandler<HTMLInputElement>;
					ref?: React.Ref<HTMLInputElement>;
					options?: never;
					inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
				});

const TEMPORAL_INPUT_TYPES = new Set<string>([
	"date",
	"datetime-local",
	"month",
	"time",
	"week",
] satisfies InputType[]);

function FormField<T extends FieldElementType>(props: FormFieldProps<T>) {
	const {
		name,
		label,
		description = null,
		invalidText = null,
		required = false,
		visuallyHideLabel = false,
		value,
		defaultValue,
		invalid = false,
		disabled = false,
		readOnly,
		placeholder,
		left,
		right,
		"aria-describedby": ariaDescribedby,
		"aria-label": ariaLabel,
		ref: forwardedRef,
		type: _type,
		id: idProp,
		options,
		...domProps
	} = props;

	const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
	const slotRefs = useLazyRef<SlotRefMap>(
		() =>
			new Map([
				["left", new Set()],
				["right", new Set()],
			]),
	);

	const id = useId(idProp, ["form-field", name]);
	const invalidTextId = makeId(id, "invalid-text");
	const descriptionId = makeId(id, "description");

	const hasInvalidText = !!(invalid && invalidText);
	const hasDescription = !!description;

	const leftSlot: React.ReactNode[] = [];
	const rightSlot: React.ReactNode[] = [];

	// user-defined left slots go first
	if (left) {
		leftSlot.push(<React.Fragment key="left">{left}</React.Fragment>);
	}

	if (props.type === "search") {
		leftSlot.push(
			<MagnifyingGlassIcon
				className={styles.searchIcon}
				key="search-icon"
				height={15}
				width={15}
				aria-hidden
			/>,
		);
	}

	if (props.type === "select") {
		rightSlot.push(
			<div aria-hidden key="select-icon" className={styles.slotButton}>
				<CaretDownIcon
					className={clsx(styles.slotIcon, disabled && styles.slotIconDisabled)}
					height={15}
					width={15}
				/>
			</div>,
		);
	} else if (props.type && TEMPORAL_INPUT_TYPES.has(props.type as InputType)) {
		const Icon = props.type === "time" ? ClockIcon : CalendarIcon;
		rightSlot.push(
			<button
				type="button"
				data-temporal-trigger=""
				key="calendar-button"
				tabIndex={-1}
				className={styles.slotButton}
				onClick={(event) => {
					const input = inputRef.current;
					if (input && isInputElement(input) && TEMPORAL_INPUT_TYPES.has(input.type)) {
						event.preventDefault();
						input.focus();
						try {
							input.showPicker();
						} catch {}
					}
				}}
			>
				<Icon
					className={clsx(styles.slotIcon, disabled && styles.slotIconDisabled)}
					height={15}
					width={15}
					aria-hidden
				/>
			</button>,
		);
	}

	// user-defined right slots go last
	if (right) {
		rightSlot.push(<React.Fragment key="right">{right}</React.Fragment>);
	}

	const ref = useComposedRefs(inputRef, forwardedRef);

	const sharedInputProps = {
		ref,
		id,
		name,
		required,
		value,
		defaultValue,
		"aria-label": ariaLabel,
		"aria-describedby":
			[ariaDescribedby, hasInvalidText && invalidTextId, hasDescription && descriptionId]
				.filter(Boolean)
				.join(" ") || undefined,
	};

	return (
		<TextFieldContext
			value={{
				slotRefs,
				inputRef,
				type: props.type ?? "text",
				invalid,
				disabled,
			}}
		>
			<div className={styles.root}>
				<div className={styles.labelRow}>
					<label className={visuallyHideLabel ? styles.labelHidden : styles.label} htmlFor={id}>
						{label}
					</label>
				</div>
				<FormFieldControlRoot type={props.type ?? "text"}>
					{leftSlot.length > 0 && <FormFieldSlot side="left">{leftSlot}</FormFieldSlot>}
					{props.type === "select" ? (
						<FormFieldSelect {...sharedInputProps} {...domProps} onChange={props.onChange}>
							{props.placeholder ? (
								<option value="" disabled>
									{props.placeholder}
								</option>
							) : null}
							{options?.map((option) => (
								<option key={option.value} value={option.value} disabled={option.disabled}>
									{option.label ?? option.value}
								</option>
							))}
						</FormFieldSelect>
					) : props.type === "textarea" ? (
						<FormFieldTextarea
							{...sharedInputProps}
							{...domProps}
							readOnly={readOnly}
							placeholder={placeholder}
							onChange={props.onChange}
						/>
					) : (
						<FormFieldInput
							{...sharedInputProps}
							{...domProps}
							type={props.type ?? "text"}
							readOnly={readOnly}
							placeholder={placeholder}
							onChange={props.onChange}
						/>
					)}

					{rightSlot.length > 0 && <FormFieldSlot side="right">{rightSlot}</FormFieldSlot>}
				</FormFieldControlRoot>
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
			</div>
		</TextFieldContext>
	);
}

interface FormFieldControlRootOwnProps {
	type: InputType | "select" | "textarea";
}
interface FormFieldControlRootProps
	extends
		FormFieldControlRootOwnProps,
		Omit<
			React.ComponentPropsWithRef<"div">,
			keyof FormFieldControlRootOwnProps | "color" | "disabled"
		> {}

function FormFieldControlRoot({
	children,
	className,
	style,
	onPointerDown,
	...elementProps
}: FormFieldControlRootProps) {
	const { inputRef, slotRefs, disabled, invalid } = useFormFieldContext();
	const isSelecting = React.useRef(false);

	return (
		<div
			style={style}
			className={clsx(
				className,
				styles.controlRoot,
				invalid && styles.controlRootInvalid,
				disabled && styles.controlRootDisabled,
			)}
			onPointerDown={(event) => {
				onPointerDown?.(event);
				const isRightClick = event.button === 2;
				const isControlClick = event.button === 0 && event.ctrlKey;
				if (event.defaultPrevented || isRightClick || isControlClick) {
					return;
				}

				const currentTarget = event.currentTarget;
				const target = event.target;
				const input = inputRef.current;
				const slots = slotRefs.current;

				if (
					!input ||
					target === input ||
					!isElement(target) ||
					isWithinInteractiveElement(target, currentTarget)
				) {
					return;
				}

				switch (true) {
					case isSelectElement(input):
						event.preventDefault();
						input.focus();
						try {
							input.showPicker();
						} catch {}
						break;

					// @ts-expect-error: intentionally fall-through; text inputs and
					// textareas should be treated the same way
					case isInputElement(input): {
						if (TEMPORAL_INPUT_TYPES.has(input.type)) {
							event.preventDefault();
							input.focus();
							break;
						}
					}
					case isTextareaElement(input): {
						const isRightSlot = slots.get("right")?.has(target as HTMLElement);
						const cursorPosition = isRightSlot ? input.value.length : 0;

						isSelecting.current = true;
						window.requestAnimationFrame(() => {
							// Only some input types support this. Browsers will throw an
							// InvalidStateError error if not supported.
							// See https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange#:~:text=The%20element%20must%20be%20of%20one%20of%20the%20following%20input%20types
							try {
								input.setSelectionRange(cursorPosition, cursorPosition);
							} catch {
							} finally {
								isSelecting.current = false;
								input.focus();
							}
						});
						break;
					}
					default:
						return;
				}

				if (
					!(isInputElement(input) || isTextareaElement(input)) ||
					TEMPORAL_INPUT_TYPES.has(input.type)
				) {
					return;
				}
			}}
			{...elementProps}
		>
			{children}
		</div>
	);
}

type FormFieldControlProps<T extends FieldElementType> = {
	as: T;
} & Omit<React.ComponentPropsWithRef<T>, "invalid" | "disabled">;

function FormFieldControl<T extends FieldElementType>({
	as: Component,
	ref: forwardedRef,
	className,
	...props
}: FormFieldControlProps<T>) {
	const { inputRef, invalid, disabled } = useFormFieldContext();
	const ref = useComposedRefs(inputRef, forwardedRef);
	return (
		<Component
			data-form-field-control=""
			aria-invalid={invalid || undefined}
			disabled={disabled || undefined}
			{...(props as any)}
			ref={ref}
			className={clsx(className, styles.control, disabled && styles.controlDisabled)}
		/>
	);
}

interface FormFieldInputOwnProps {
	defaultValue?: string | number;
	value?: string | number;
	type?:
		| "date"
		| "datetime-local"
		| "email"
		| "hidden"
		| "month"
		| "number"
		| "password"
		| "search"
		| "tel"
		| "text"
		| "time"
		| "url"
		| "week";
}
interface FormFieldInputProps
	extends
		FormFieldInputOwnProps,
		Omit<
			React.ComponentPropsWithRef<"input">,
			keyof FormFieldInputOwnProps | "color" | "checked" | "defaultChecked" | "disabled"
		> {}

function FormFieldInput({ className, type, ...props }: FormFieldInputProps) {
	return (
		<FormFieldControl
			as="input"
			spellCheck="false"
			{...props}
			type={type}
			className={clsx(className, styles.input)}
		/>
	);
}

interface FormFieldSelectOwnProps {}
interface FormFieldSelectProps
	extends
		FormFieldSelectOwnProps,
		Omit<
			React.ComponentPropsWithRef<"select">,
			keyof FormFieldSelectOwnProps | "color" | "disabled"
		> {}

function FormFieldSelect({ className, ...props }: FormFieldSelectProps) {
	return <FormFieldControl as="select" {...props} className={clsx(className, styles.select)} />;
}

interface FormFieldTextareaOwnProps {}
interface FormFieldTextareaProps
	extends
		FormFieldTextareaOwnProps,
		Omit<
			React.ComponentPropsWithRef<"textarea">,
			keyof FormFieldTextareaOwnProps | "color" | "disabled"
		> {}

function FormFieldTextarea({ className, ...props }: FormFieldTextareaProps) {
	return <FormFieldControl as="textarea" {...props} className={clsx(className, styles.textarea)} />;
}

interface FormFieldSlotOwnProps {
	side: "left" | "right";
}
interface FormFieldSlotProps
	extends
		Omit<React.ComponentPropsWithRef<"div">, keyof FormFieldSlotOwnProps | "color">,
		FormFieldSlotOwnProps {}

function FormFieldSlot({ className, side, ref: forwardedRef, ...slotProps }: FormFieldSlotProps) {
	const { slotRefs, type } = useFormFieldContext();
	const ref = useComposedRefs(
		React.useCallback(
			// oxlint-disable-next-line react/react-compiler
			(node: HTMLDivElement | null) => {
				const slots = slotRefs.current.get(side);
				if (!slots) return;
				if (node) slots.add(node);
				return () => {
					if (node) slots.delete(node);
				};
			},
			[side, slotRefs],
		),
		forwardedRef,
	);

	return (
		<div
			data-side={side}
			ref={ref}
			{...slotProps}
			className={clsx(
				className,
				styles.slot,
				(type === "select" || TEMPORAL_INPUT_TYPES.has(type)) && styles.slotPicker,
				side === "left" && styles.slotLeft,
				side === "right" && styles.slotRight,
			)}
		/>
	);
}

export { FormField };
export type { FormFieldProps };

function makeId(...parts: string[]) {
	const DELIMITER = "--";
	return parts.filter(isValidId).join(DELIMITER);
}

function useId(userProvidedId: string | number | undefined | null, prefixes: string[]) {
	const uuid = React.useId();
	if (isValidId(userProvidedId)) {
		return String(userProvidedId);
	}

	return makeId(...prefixes, uuid);
}

function isValidId<T extends string | number | undefined | null>(
	id: T,
): id is T & (string | number) {
	return id !== undefined && id !== null && id !== "";
}

const INTERACTIVE_ELEMENTS = new Set([
	"A",
	"BUTTON",
	"DATALIST",
	"DETAILS",
	"DIALOG",
	"INPUT",
	"LABEL",
	"MENU",
	"SELECT",
	"SUMMARY",
	"TEXTAREA",
] as const);

function isElement(element: object): element is Element {
	return "tagName" in element && typeof element.tagName === "string";
}

function isInteractiveElement(element: object): element is HTMLElement {
	return (
		"tagName" in element &&
		typeof element.tagName === "string" &&
		(INTERACTIVE_ELEMENTS as Set<string>).has(element.tagName)
	);
}

function isWithinInteractiveElement(element: Element, boundary: HTMLElement) {
	// walk up the DOM tree until we find an interactive element
	let current: Element | null = element;
	while (current) {
		if (current === boundary) {
			return false;
		}
		if (isInteractiveElement(current)) {
			return true;
		}
		current = current.parentElement;
	}
	return false;
}

function isInputElement(element: object): element is HTMLInputElement {
	return "tagName" in element && typeof element.tagName === "string" && element.tagName === "INPUT";
}

function isTextareaElement(element: object): element is HTMLTextAreaElement {
	return (
		"tagName" in element && typeof element.tagName === "string" && element.tagName === "TEXTAREA"
	);
}

function isSelectElement(element: object): element is HTMLSelectElement {
	return (
		"tagName" in element && typeof element.tagName === "string" && element.tagName === "SELECT"
	);
}
