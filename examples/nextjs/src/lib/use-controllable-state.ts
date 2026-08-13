/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * Fork of https://github.com/adobe/react-spectrum/tree/main/packages/react-stately/src/utils/useControlledState.ts
 */
import * as React from "react";

// oxlint-disable react/react-compiler
function useControllableStateWarning(controlledValue: unknown) {
	if (process.env.NODE_ENV !== "development") {
		return;
	}

	const warned = React.useRef(false);
	const wasControlled = React.useRef(controlledValue !== undefined);
	const isControlled = controlledValue !== undefined;
	React.useEffect(() => {
		if (warned.current) {
			return;
		}
		const docsUrl = "https://reactjs.org/link/controlled-components";
		if (wasControlled.current && !isControlled) {
			warned.current = true;
			console.warn(
				`Warning: A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: ${docsUrl}`,
			);
		} else if (!wasControlled.current && isControlled) {
			warned.current = true;
			console.warn(
				`Warning: A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: ${docsUrl}`,
			);
		}
	}, [isControlled]);
}

export function useControllableState<T, C = T>(
	value: Exclude<T, undefined>,
	defaultValue: Exclude<T, undefined> | undefined,
	onChange?: (v: C, ...args: any[]) => void,
): [T, (value: React.SetStateAction<T>, ...args: any[]) => void];
export function useControllableState<T, C = T>(
	value: Exclude<T, undefined> | undefined,
	defaultValue: Exclude<T, undefined>,
	onChange?: (v: C, ...args: any[]) => void,
): [T, (value: React.SetStateAction<T>, ...args: any[]) => void];

export function useControllableState<T, C = T>(
	value: T,
	defaultValue: T,
	onChange?: (v: C, ...args: any[]) => void,
): [T, (value: React.SetStateAction<T>, ...args: any[]) => void] {
	// Store the value in both state and a ref. The state value will only be used
	// when uncontrolled. The ref is used to track the most current value, which
	// is passed to the function setState callback.
	const [stateValue, setStateValue] = React.useState(value || defaultValue);
	const valueRef = React.useRef(stateValue);
	useControllableStateWarning(value);

	const isControlled = value !== undefined;
	// After each render, update the ref to the current value. This ensures that
	// the setState callback argument is reset. Note: the effect should not have
	// any dependencies so that controlled values always reset.
	const currentValue = isControlled ? value : stateValue;
	React.useInsertionEffect(() => {
		valueRef.current = currentValue;
	});

	const [, forceUpdate] = React.useReducer(() => ({}), {});
	const setValue = React.useCallback(
		(value: React.SetStateAction<T>, ...args: any[]) => {
			let newValue = typeof value === "function" ? (value as Function)(valueRef.current) : value;
			if (!Object.is(valueRef.current, newValue)) {
				// Update the ref so that the next callback has the most recent value
				valueRef.current = newValue;

				setStateValue(newValue);

				// Always trigger a re-render, even when controlled, so that the layout
				// effect above runs to reset the value.
				forceUpdate();

				// Trigger onChange. Note that if setState is called multiple times in a
				// single event, onChange will be called for each one instead of only
				// once.
				onChange?.(newValue, ...args);
			}
		},
		[onChange],
	);

	return [currentValue, setValue];
}
