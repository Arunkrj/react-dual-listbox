import React from 'react';

import Action from './Action';

class DualListBox extends React.Component {
	static propTypes = {
		name: React.PropTypes.string,
		options: React.PropTypes.array,
		available: React.PropTypes.array,
		selected: React.PropTypes.array,
		onChange: React.PropTypes.func,
		preserveSelectOrder: React.PropTypes.bool,
	};

	/**
	 * @param {Object} props
	 *
	 * @returns {void}
	 */
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onDoubleClick = this.onDoubleClick.bind(this);
	}

	/**
	 * @param {Object} event
	 *
	 * @return {void}
	 */
	onClick(event) {
		const { target } = event;
		const { options, onChange } = this.props;
		const direction = target.dataset.moveDirection;
		const isMoveAll = target.dataset.moveAll;
		const select = direction === 'right' ? this.available : this.selected;

		let selected = [];

		if (isMoveAll === '1') {
			selected = direction === 'right' ? this.makeOptionsSelected(options) : [];
		} else {
			selected = this.toggleSelected(
				this.getSelectedOptions(select)
			);
		}

		onChange(selected);
	}

	/**
	 * @param {Object} event
	 *
	 * @returns {void}
	 */
	onDoubleClick(event) {
		const value = event.target.value;
		const selected = this.toggleSelected([value]);

		this.props.onChange(selected);
	}

	/**
	 * Converts a flat array to a key/value mapping.
	 *
	 * @param {Array} options
	 *
	 * @returns {Object}
	 */
	getLabelMap(options) {
		let labelMap = {};

		options.forEach((option) => {
			if (option.options !== undefined) {
				labelMap = { ...labelMap, ...this.getLabelMap(option.options) };
			} else {
				labelMap[option.value] = option.label;
			}
		});

		return labelMap;
	}

	/**
	 * Returns the selected options from a given element.
	 *
	 * @param {Object} element
	 *
	 * @returns {Array}
	 */
	getSelectedOptions(element) {
		return [...element.options]
			.filter((option) => option.selected)
			.map((option) => option.value);
	}

	/**
	 * Make all the given options selected.
	 *
	 * @param {Array} options
	 *
	 * @returns {Array}
	 */
	makeOptionsSelected(options) {
		let selected = [];

		this.filterAvailable(options).forEach((option) => {
			if (option.options !== undefined) {
				selected = [...selected, ...this.makeOptionsSelected(option.options)];
			} else {
				selected.push(option.value);
			}
		});

		return [...this.props.selected, ...selected];
	}

	/**
	 * Toggle a new set of selected elements.
	 *
	 * @param {Array} selected
	 *
	 * @returns {Array}
	 */
	toggleSelected(selected) {
		const oldSelected = this.props.selected.slice(0);

		selected.forEach((value) => {
			const index = oldSelected.indexOf(value);

			if (index >= 0) {
				oldSelected.splice(index, 1);
			} else {
				oldSelected.push(value);
			}
		});

		return oldSelected;
	}

	/**
	 * Filter options by a filtering function.
	 *
	 * @param {Array} options
	 * @param {Function} filterer
	 *
	 * @returns {Array}
	 */
	filterOptions(options, filterer) {
		const filtered = [];

		options.forEach((option) => {
			if (option.options !== undefined) {
				const children = this.filterOptions(option.options, filterer);

				if (children.length > 0) {
					filtered.push({
						label: option.label,
						options: children,
					});
				}
			} else if (filterer(option)) {
				filtered.push(option);
			}
		});

		return filtered;
	}

	/**
	 * Filter the available options.
	 *
	 * @param {Array} options
	 *
	 * @returns {Array}
	 */
	filterAvailable(options) {
		if (this.props.available !== undefined) {
			return this.filterOptions(options, (option) =>
				this.props.available.indexOf(option.value) >= 0 &&
				this.props.selected.indexOf(option.value) < 0
			);
		}

		// Show all un-selected options
		return this.filterOptions(options, (option) =>
			this.props.selected.indexOf(option.value) < 0
		);
	}

	/**
	 * Filter the selected options.
	 *
	 * @param {Array} options
	 *
	 * @returns {Array}
	 */
	filterSelected(options) {
		if (this.props.preserveSelectOrder) {
			return this.filterSelectedByOrder(options);
		}

		// Order the selections by the default order
		return this.filterOptions(options, (option) =>
			this.props.selected.indexOf(option.value) >= 0
		);
	}

	/**
	 * Preserve the selection order. This drops the opt-group associations.
	 *
	 * @param {Array} options
	 *
	 * @returns {Array}
	 */
	filterSelectedByOrder(options) {
		const labelMap = this.getLabelMap(options);

		return this.props.selected.map((selected) => ({
			value: selected,
			label: labelMap[selected],
		}));
	}

	/**
	 * @returns {Array}
	 */
	renderOptions(options) {
		return options.map((option, index) => {
			if (option.options !== undefined) {
				return (
					<optgroup key={index} label={option.label}>
						{this.renderOptions(option.options)}
					</optgroup>
				);
			}

			return (
				<option key={index} value={option.value} onDoubleClick={this.onDoubleClick}>
					{option.label}
				</option>
			);
		});
	}

	/**
	 * @returns {React.Component}
	 */
	render() {
		const { options } = this.props;
		const available = this.renderOptions(this.filterAvailable(options));
		const selected = this.renderOptions(this.filterSelected(options));

		return (
			<div className="react-dual-listbox">
				<div className="rdl-available">
					<select className="form-control" multiple ref={(c) => { this.available = c; }}>
						{available}
					</select>
				</div>
				<div className="rdl-actions">
					<div className="rdl-actions-right">
						<Action direction="right" isMoveAll onClick={this.onClick} />
						<Action direction="right" onClick={this.onClick} />
					</div>
					<div className="rdl-actions-left">
						<Action direction="left" onClick={this.onClick} />
						<Action direction="left" isMoveAll onClick={this.onClick} />
					</div>
				</div>
				<div className="rdl-selected">
					<select
						className="form-control"
						multiple
						name={this.props.name}
						ref={(c) => { this.selected = c; }}
					>
						{selected}
					</select>
				</div>
			</div>
		);
	}
}

export default DualListBox;
