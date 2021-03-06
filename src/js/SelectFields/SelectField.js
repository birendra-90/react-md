import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import cn from 'classnames';
import deprecated from 'react-prop-types/lib/deprecated';
import isRequiredForA11y from 'react-prop-types/lib/isRequiredForA11y';

import { UP, DOWN, ESC, TAB, ZERO, NINE, KEYPAD_ZERO, KEYPAD_NINE } from '../constants/keyCodes';
import omit from '../utils/omit';
import getField from '../utils/getField';
import isBetween from '../utils/NumberUtils/isBetween';
import handleKeyboardAccessibility from '../utils/EventUtils/handleKeyboardAccessibility';
import controlled from '../utils/PropTypes/controlled';
import FontIcon from '../FontIcons/FontIcon';
import anchorShape from '../Helpers/anchorShape';
import fixedToShape from '../Helpers/fixedToShape';
import positionShape from '../Helpers/positionShape';
import Menu from '../Menus/Menu';
import ListItem from '../Lists/ListItem';

import SelectFieldToggle from './SelectFieldToggle';

const MOBILE_LIST_PADDING = 8;

export default class SelectField extends PureComponent {
  static HorizontalAnchors = Menu.HorizontalAnchors;
  static VerticalAnchors = Menu.VerticalAnchors;
  static Positions = Menu.Positions;

  static propTypes = {
    /**
     * An id to give the select field. This is required for accessibility.
     */
    id: isRequiredForA11y(PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ])),

    /**
     * An optional name to give to the select field.
     */
    name: PropTypes.string,

    /**
     * An optional id to provide to the select field's menu. If this is omitted,
     * it will default to `${id}-menu`.
     */
    menuId: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    /**
     * An optional id to provide to the select field's list.
     *
     * @see {@link #menuId}
     * @see {@link Menus/Menu#menuId}
     */
    listId: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    /**
     * An optional style to apply to the select field's container (the menu).
     */
    style: PropTypes.object,

    /**
     * An optional className to apply to the select field's container (the menu).
     */
    className: PropTypes.string,

    /**
     * An optional style to apply to the menu's list.
     */
    listStyle: PropTypes.object,

    /**
     * An optional className to apply to the menu's list.
     */
    listClassName: PropTypes.string,

    /**
     * An optional style to apply to the select field's toggle.
     */
    toggleStyle: PropTypes.object,

    /**
     * An optional className to apply to the select field's toggle.
     */
    toggleClassName: PropTypes.string,

    /**
     * An optional style to apply to the `AccessibleFakeInkedButton` that is the trigger
     * for the select field.
     */
    inputStyle: PropTypes.object,

    /**
     * An optional className to apply to the `AccessibleFakeInkedButton` that is the trigger
     * for the select field.
     */
    inputClassName: PropTypes.string,

    /**
     * Boolean if the select field should be have the menu's list visible by default.
     */
    defaultVisible: PropTypes.bool.isRequired,

    /**
     * Boolean if the select field should have the menu's list visible. This will make
     * the select field controlled and require the `onVisibilityChange` prop to be defined,
     */
    visible: controlled(PropTypes.bool, 'onVisibilityChange', 'defaultVisible'),

    /**
     * An optional function to call when the select field's menu has it's visibility changed. The callback
     * will include the next visible state and the event that triggered it.
     */
    onVisibilityChange: PropTypes.func,

    /**
     * A list of `number`, `string`, or `object` that should be used to create `ListItem`
     * in the menu's list. When it is an `object`, it will use the `dataLabel` prop as the
     * `primaryText` and use the value of `dataValue`.
     *
     * @see {@link #dataLabel}
     * @see {@link #dataValue}
     */
    menuItems: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.object,
    ])).isRequired,

    /**
     * The amount of time that a list of letters should be used when finding a menu item
     * while typing. Since a user can select items by typing multiple letters in a row,
     * this will be used as the timeout for clearing those letters.
     *
     * For example:
     * - User types `g`
     *
     * Full match is now `'g'`.
     *
     * - User delays 200ms and types `u`
     *
     * Full match is now `'gu'`
     *
     * - User delays 1000ms and types `a`.
     *
     * Full match is now `'a'`
     */
    keyboardMatchingTimeout: PropTypes.number.isRequired,

    /**
     * The key to use for extracting a menu item's label if the menu item is an object.
     *
     * Example:
     *
     * ```js
     * const item = { something: 'My Label', somethingElse: 'value' };
     * const itemLabel = 'something';
     * const itemValue = 'somethingElse';
     * ```
     */
    itemLabel: PropTypes.string.isRequired,

    /**
     * The key to use for extracting a menu item's value if the menu item is an object.
     *
     * Example:
     *
     * ```js
     * const item = { something: 'My Label', somethingElse: 'value' };
     * const itemLabel = 'something';
     * const itemValue = 'somethingElse';
     * ```
     */
    itemValue: PropTypes.string.isRequired,

    /**
     * The default value to use for the select field. If this is set, it should either match
     * one of the `number` or `string` in your `menuItems` list or be the empty string. If
     * the `menuItems` is a list of `object`, this value should match one of the menu item's
     * `dataValue` or be the empty string.
     *
     * ```js
     * const menuItems = [{ label: 'Something': value: 0 }, { label: 'Something else', value: 1 }];
     *
     * // both valid
     * defaultValue={0}
     * defaultValue=""
     * ```
     */
    defaultValue: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,

    /**
     * The value to use for the select field. If this is defined, it becomes a controlled component
     * and requires the `onChange` prop to be defined. See the `defaultValue` for more behavior info.
     *
     * @see {@link #defaultValue}
     */
    value: controlled(PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]), 'onChange', 'defaultValue'),

    /**
     * An optional function to call when the select field's value has been changed either when the user
     * has click/touched/keyboard selected a value in the list, or the user has selected a value by typing
     * in the select field while the menu's list is closed.
     *
     * The callback will include the next text field value, the selected item's index, the event that
     * triggered the change, and the id, name, and value of the select field.
     *
     * ```js
     * onChange(value, index, event, { id, name, value });
     * ```
     */
    onChange: PropTypes.func,

    /**
     * An optional label to use with the select field. This will be a floating label as seen on the text field.
     */
    label: PropTypes.node,

    /**
     * An optional placeholder to use in the select field. This will only appear when no value has been selected.
     */
    placeholder: PropTypes.string,

    /**
     * Boolean if the select field should be disabled.
     */
    disabled: PropTypes.bool,

    /**
     * Boolean if the select field is required. This will update the label and placeholder to include a `*` suffix.
     */
    required: PropTypes.bool,

    /**
     * Boolean if the select field is considered to be in an `error` state.
     *
     * @see {@link TextFields/TextField#error}
     */
    error: PropTypes.bool,

    /**
     * An optional text to display when the text select field is in an error state.
     *
     * @see {@link TextFields/TextField#errorText}
     */
    errorText: PropTypes.node,

    /**
     * An optional text to display below the select field to provide input help to the user.
     * This will only be displayed if the select field is not in an error state.
     *
     * @see {@link #helpOnFocus}
     * @see {@link TextFields/TextField#errorText}
     */
    helpText: PropTypes.node,

    /**
     * Boolean if the `helpText` should only appear on focus.
     *
     * @see {@link #helpText}
     * @see {@link TextFields/TextField#helpOnFocus}
     */
    helpOnFocus: PropTypes.bool,

    /**
     * An optional function to call when any element in the select field has been clicked.
     */
    onClick: PropTypes.func,

    /**
     * An optional function to call when the `keydown` event has been triggered anywhere in the
     * select field.
     */
    onKeyDown: PropTypes.func,

    /**
     * An optional function to call when the select field's toggle has gained focus.
     */
    onFocus: PropTypes.func,

    /**
     * An optional function to call when the select field's toggle has been blurred. This
     * will be triggered if the user hits the up or down arrow keys to traverse the list
     * of items.
     */
    onBlur: PropTypes.func,

    /**
     * The icon to use to display the dropdown arrow.
     */
    dropdownIcon: PropTypes.element,

    /**
     * Boolean if the select field is in a toolbar. This should automatically be injected by the `Toolbar`
     * component if being used as a `titleMenu` or one of the `actions`.
     *
     * @see {@link Toolbars/Toolbar#titleMenu}
     * @see {@link Toolbars/Toolbar#actions}
     */
    toolbar: PropTypes.bool,

    /**
     * Boolean if the currently active item should be removed from the list of available `menuItems`.
     * If this is `undefined`, it will strip out the active one only when the
     * `position === SelectField.Positions.BELOW`.
     */
    stripActiveItem: PropTypes.bool,

    /**
     * The transition name to use when a new value has been selected. By default, it will have the
     * new item _drop_ into the select field's input location.
     */
    transitionName: PropTypes.string.isRequired,

    /**
     * The transition time to use when a new value has been selected. If this value is `0`, there
     * will be no transition.
     */
    transitionTime: PropTypes.number.isRequired,

    /**
     * This is how the menu's `List` gets anchored to the select field.
     *
     * @see {@link Helpers/Layovers#anchor}
     */
    anchor: anchorShape,

    /**
     * This is the anchor to use when the `position` is set to `Autocomplete.Positions.BELOW`.
     *
     * @see {@link Helpers/Layovers#belowAnchor}
     */
    belowAnchor: anchorShape,

    /**
     * This is the animation position for the list that appears.
     *
     * @see {@link Helpers/Layovers#animationPosition}
     */
    position: positionShape,

    /**
     * This is how the menu's list will be "fixed" to the `toggle` component.
     *
     * @see {@link Helpers/Layovers#fixedTo}
     */
    fixedTo: fixedToShape,

    /**
     * Boolean if the menu's list should appear horizontally instead of vertically.
     */
    listInline: PropTypes.bool,

    /**
     * The list's z-depth for applying box shadow. This should be a number from 0 to 5.
     */
    listZDepth: PropTypes.number,

    /**
     * Boolean if the list should have its height restricted to the `$md-menu-mobile-max-height`/
     * `$md-menu-desktop-max-height` values.
     *
     * @see [md-menu-mobile-max-height](/components/menus?tab=1#variable-md-menu-mobile-max-height)
     * @see [md-menu-desktop-max-height](/components/menus?tab=1#variable-md-menu-desktop-max-height)
     */
    listHeightRestricted: PropTypes.bool,

    /**
     * @see {@link Helpers/Layovers#xThreshold}
     */
    xThreshold: PropTypes.number,

    /**
     * @see {@link Helpers/Layovers#yThreshold}
     */
    yThreshold: PropTypes.number,

    /**
     * @see {@link Helpers/Layovers#closeOnOutsideClick}
     */
    closeOnOutsideClick: PropTypes.bool,

    /**
     * An optional transition name to use for the list appearing/disappearing.
     *
     * @see {@link Menus/Menu#transitionName}
     */
    menuTransitionName: PropTypes.string,

    /**
     * @see {@link Helpers/Layovers#transitionEnterTimeout}
     */
    menuTransitionEnterTimeout: PropTypes.number,

    /**
     * @see {@link Helpers/Layovers#transitionLeaveTimeout}
     */
    menuTransitionLeaveTimeout: PropTypes.number,

    /**
     * @see {@link Menus/Menu#block}
     */
    block: PropTypes.bool,

    /**
     * @see {@link Menus/Menu#fullWidth}
     */
    fullWidth: PropTypes.bool,

    /**
     * @see {@link Helpers/Layovers#centered}
     */
    centered: Menu.propTypes.centered,

    /**
     * @see {@link Helpers/Layovers#sameWidth}
     */
    sameWidth: Menu.propTypes.sameWidth,

    /**
     * Since the `menuItems` get mapped into `ListItem`, this prop is used to remove
     * any unnecessary props from the `ListItem` itself. This is where you
     * would remove parts of your object such as `description` or `__metadata__`.
     */
    deleteKeys: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ])),
    ]),

    /**
     * Boolean if the menu should automatically try to reposition itself to stay within
     * the viewport when the `fixedTo` element scrolls.
     *
     * @see {@link Helpers/Layovers#fixedTo}
     */
    repositionOnScroll: PropTypes.bool,

    /**
     * Boolean if the menu logic should be simplified without any viewport logic and position
     * based on the relative position of the menu. This will most like require some additional
     * styles applied to the menu.
     *
     * @see {@link Helpers/Layovers#simplified}
     */
    simplifiedMenu: PropTypes.bool,

    /**
     * @see {@link Helpers/Layovers#minLeft}
     */
    minLeft: Menu.propTypes.minLeft,

    /**
     * @see {@link Helpers/Layovers#minRight}
     */
    minRight: Menu.propTypes.minLeft,

    /**
     * @see {@link Helpers/Layovers#minBottom}
     */
    minBottom: Menu.propTypes.minBottom,

    /**
     * @see {@link Helpers/Layovers#fillViewportWidth}
     */
    fillViewportWidth: PropTypes.bool,

    /**
     * @see {@link Helpers/Layovers#fillViewportHeight}
     */
    fillViewportHeight: PropTypes.bool,

    iconChildren: deprecated(PropTypes.node, 'Use `dropdownIcon` instead'),
    iconClassName: deprecated(PropTypes.string, 'Use `dropdownIcon` instead'),
    isOpen: deprecated(PropTypes.bool, 'Use `visible` instead'),
    defaultOpen: deprecated(PropTypes.bool, 'Use `defaultVisible` instead'),
    initiallyOpen: deprecated(PropTypes.bool, 'Use `defaultVisible` instead'),
    onMenuToggle: deprecated(PropTypes.func, 'Use `onVisibilityChange` instead'),
    stretchList: deprecated(
      PropTypes.bool,
      'No longer valid after the changes to the `Menu` component. Possibly use `sameWidth` instead'
    ),
    menuStyle: deprecated(PropTypes.object, 'Use `style` instead'),
    menuClassName: deprecated(PropTypes.string, 'Use `className` instead'),
    floatingLabel: deprecated(
      PropTypes.bool,
      'A select field can only have floating labels now. Only provide the `label` prop'
    ),
    noAutoAdjust: deprecated(PropTypes.bool, 'No longer valid to use since select fields are no longer text fields'),
    adjustMinWidth: deprecated(PropTypes.bool, 'No longer valid to use since select fields are no longer text fields'),
  };

  static defaultProps = {
    anchor: {
      x: SelectField.HorizontalAnchors.INNER_LEFT,
      y: SelectField.VerticalAnchors.OVERLAP,
    },
    fixedTo: Menu.defaultProps.fixedTo,
    position: SelectField.Positions.TOP_LEFT,
    itemLabel: 'label',
    itemValue: 'value',
    dropdownIcon: <FontIcon>arrow_drop_down</FontIcon>,
    menuItems: [],
    defaultValue: '',
    defaultVisible: false,
    keyboardMatchingTimeout: 1000,
    transitionName: 'md-drop',
    transitionTime: 300,
    repositionOnScroll: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      error: false,
      active: false,
      ...this._getActive(props, { value: props.defaultValue }),
      listProps: {
        role: 'listbox',
        ref: this._scrollActiveIntoView,
        'aria-activedescendant': null,
      },
      match: null,
      lastSearch: null,
      value: props.defaultValue,
      visible: props.defaultVisible,
    };

    this._items = [];
    this._activeItem = null;
    this._deleteKeys = this._getDeleteKeys(props);
  }

  componentDidMount() {
    this._container = findDOMNode(this);
    this._field = this._container.querySelector('.md-select-field');
  }

  componentWillReceiveProps(nextProps) {
    const { itemLabel, itemValue, deleteKeys } = this.props;
    if (deleteKeys !== nextProps.deleteKeys || itemLabel !== nextProps.itemLabel || itemValue !== nextProps.itemValue) {
      this._deleteKeys = this._getDeleteKeys(nextProps);
    }
  }

  componentWillUpdate(nextProps, nextState) {
    const { value, menuItems } = this.props;
    const { active, listProps } = nextState;

    let state;
    if (value !== nextProps.value || menuItems !== nextProps.menuItems) {
      state = this._getActive(nextProps, nextState);
    }

    if (this.state.active !== active) {
      state = state || {};
      state.listProps = {
        ...listProps,
        'aria-activedescendant': active ? `${nextProps.id}-options-active` : null,
      };
    }

    if (state) {
      this.setState(state);
    }
  }

  /**
   * Gets the current value from the select field. This is used when you have an uncontrolled
   * text field and simply need the value from a ref callback.
   *
   * @return {String} the select field's value
   */
  get value() {
    return getField(this.props, this.state, 'value');
  }

  _getItemPart(item, itemLabel, itemValue, preferLabel = false) {
    const type = typeof item;
    if (type === 'number' || type === 'string') {
      return item;
    } else if (type === 'object') {
      const key1 = preferLabel ? itemLabel : itemValue;
      const key2 = preferLabel ? itemValue : itemLabel;
      return typeof item[key1] !== 'undefined' ? item[key1] : item[key2];
    }

    return '';
  }

  _getDeleteKeys({ itemLabel, itemValue, deleteKeys }) {
    const keys = [itemLabel, itemValue];
    if (deleteKeys) {
      return keys.concat(Array.isArray(deleteKeys) ? deleteKeys : [deleteKeys]);
    }

    return keys;
  }

  _getActiveItemLabel = (item, value, itemLabel, itemValue) => {
    const v = this._getItemPart(item, itemLabel, itemValue);
    const label = this._getItemPart(item, itemLabel, itemValue, true);

    return v === value || v === parseInt(value, 10) ? label : '';
  };

  _getActive = (props, state) => {
    let activeLabel = '';
    let activeIndex = -1;
    const value = getField(props, state, 'value');
    if (value || value === 0) {
      const { menuItems, itemLabel, itemValue } = props;

      menuItems.some((item, index) => {
        activeLabel = this._getActiveItemLabel(item, value, itemLabel, itemValue);
        const found = activeLabel || activeLabel === 0;
        if (found) {
          activeIndex = index;
        }

        return found;
      });
    }

    return { activeLabel, activeIndex };
  };

  _attemptItemFocus = (index) => {
    if (index === -1) {
      return;
    }

    const item = this._items[index];
    if (item) {
      item.focus();
    }
  };

  _setListItem = (item) => {
    if (!item) {
      return;
    }

    if (item.props.active) {
      this._activeItem = findDOMNode(item);
      item.focus();
    }

    this._items.push(item);
  };

  _scrollActiveIntoView = (listRef) => {
    if (listRef === null) {
      this._items = [];
      return;
    } else if (!this._activeItem) {
      return;
    }

    const list = findDOMNode(listRef);
    const { offsetTop } = this._activeItem;
    list.scrollTop = offsetTop > MOBILE_LIST_PADDING ? offsetTop : 0;
  };

  _toggle = (e) => {
    const { isOpen, onVisibilityChange, onMenuToggle } = this.props;
    const visible = !(typeof isOpen !== 'undefined' ? isOpen : getField(this.props, this.state, 'visible'));
    if (onMenuToggle || onVisibilityChange) {
      (onMenuToggle || onVisibilityChange)(visible, e);
    }

    const value = getField(this.props, this.state, 'value');
    let state;
    if (e.type === 'keydown' && !value && this.state.activeIndex === -1) {
      // When there is no value, need to change the default active index to 0 instead of -1
      // so that the next DOWN arrow increments correctly
      state = { activeIndex: 0 };
    }

    if (typeof isOpen === 'undefined' && typeof this.props.visible === 'undefined') {
      state = state || {};
      state.visible = visible;
    }

    if (state) {
      this.setState(state);
    }
  };

  _close = (e) => {
    if (this.props.onVisibilityChange) {
      this.props.onVisibilityChange(false, e);
    }

    if (e.type === 'keydown' && this._field) {
      this._field.focus();
    }

    let state;
    if (this.props.required && !getField(this.props, this.state, 'value')) {
      state = { error: true };
    }

    if (typeof this.props.visible === 'undefined') {
      state = state || {};
      state.visible = false;
    }

    if (state) {
      this.setState(state);
    }
  };

  _handleClick = (e) => {
    if (this.props.onClick) {
      this.props.onClick(e);
    }

    const { isOpen } = this.props;
    const visible = typeof isOpen !== 'undefined' ? isOpen : getField(this.props, this.state, 'visible');
    if (visible && this._container) {
      let node = e.target;
      while (this._container.contains(node)) {
        if (typeof node.dataset.id !== 'undefined') {
          const { id, value } = node.dataset;
          this._selectItem(parseInt(id, 10), value, e);
          return;
        }

        node = node.parentNode;
      }
    }
  };

  _selectItem = (dataIndex, dataValue, e) => {
    const { required, menuItems, itemLabel, itemValue, onChange, id, name } = this.props;
    const value = this._getItemPart(menuItems[dataIndex], itemLabel, itemValue);
    const prevValue = getField(this.props, this.state, 'value');
    if (prevValue !== value && onChange) {
      onChange(value, dataIndex, e, { id, name, value });
    }

    const state = {
      ...this._getActive({ value, itemLabel, itemValue, menuItems }, {}),
      error: !!required && !value && value !== 0,
    };

    if (typeof this.props.value === 'undefined') {
      state.value = value;
    }

    this.setState(state);
  };

  _handleFocus = (e) => {
    if (this.props.onFocus) {
      this.props.onFocus(e);
    }

    this.setState({ active: true });
  };

  _handleBlur = (e) => {
    if (this.props.onBlur) {
      this.props.onBlur(e);
    }

    let { error } = this.state;
    const { isOpen, required } = this.props;
    const visible = typeof isOpen !== 'undefined' ? isOpen : getField(this.props, this.state, 'visible');
    const value = getField(this.props, this.state, 'value');

    if (required && !visible) {
      error = !value;
    }

    this.setState({ active: false, error });
  };

  _handleKeyDown = (e) => {
    const { isOpen, onKeyDown } = this.props;
    if (onKeyDown) {
      onKeyDown(e);
    }

    const key = e.which || e.keyCode;
    const up = key === UP;
    const down = key === DOWN;
    const visible = typeof isOpen !== 'undefined' ? isOpen : getField(this.props, this.state, 'visible');

    if (up || down) {
      e.preventDefault();

      if (!visible) {
        this._toggle(e);
        return;
      }

      this._advanceFocus(up);
    } else if (!visible && handleKeyboardAccessibility(e, this._toggle, true, true)) {
      return;
    } else if (visible && (key === ESC || key === TAB)) {
      if (this._field && key === ESC) {
        this._field.focus();
      }

      this._close(e);
      return;
    } else {
      this._selectItemByLetter(key, e);
    }
  };

  _advanceFocus = (decrement) => {
    const { menuItems, position } = this.props;
    const { activeIndex } = this.state;

    const below = position === SelectField.Positions.BELOW;

    // If the select field is positioned below and there is no value, need to increment the last index
    // by one since this select field removes the active item. Need to account for that here when there
    // is no value.
    const lastIndex = menuItems.length - (below && !getField(this.props, this.state, 'value') ? 0 : 1);
    if ((decrement && activeIndex <= 0) || (!decrement && activeIndex >= lastIndex)) {
      return;
    }

    const nextIndex = Math.max(-1, Math.min(lastIndex, activeIndex + (decrement ? -1 : 1)));
    if (nextIndex === activeIndex) {
      return;
    }

    this._attemptItemFocus(nextIndex - (below ? 1 : 0));
    if (below && decrement && nextIndex === 0) {
      return;
    }

    this.setState({ activeIndex: nextIndex });
  };

  _selectItemByLetter = (key, e) => {
    const charCode = String.fromCharCode(key);
    const isLetter = charCode && charCode.match(/[A-Za-z0-9-_ ]/);
    const isKeypad = isBetween(key, KEYPAD_ZERO, KEYPAD_NINE);
    if (!isBetween(key, ZERO, NINE) && !isKeypad && !isLetter) {
      return;
    }

    const letter = isLetter ? charCode : String(key - (isKeypad ? KEYPAD_ZERO : ZERO));

    if (this._matchingTimeout) {
      clearTimeout(this._matchingTimeout);
    }

    this._matchingTimeout = setTimeout(() => {
      this._matchingTimeout = null;

      this.setState({ match: null, lastSearch: null });
    }, this.props.keyboardMatchingTimeout);

    this._selectFirstMatch(letter, e);
  };

  _selectFirstMatch = (letter, e) => {
    const { menuItems, itemLabel, itemValue, isOpen, onChange, id, name } = this.props;
    const { lastSearch } = this.state;
    let match = -1;
    const search = `${lastSearch || ''}${letter}`.toUpperCase();
    menuItems.some((item, index) => {
      const label = String(this._getItemPart(item, itemLabel, itemValue, true));
      if (label && label.toUpperCase().indexOf(search) === 0) {
        match = index;
      }

      return match > -1;
    });

    const state = {
      match,
      lastSearch: search,
    };

    if (match !== -1) {
      const activeItem = menuItems[match];
      state.activeLabel = this._getItemPart(activeItem, itemLabel, itemValue, true);
      state.activeIndex = match;

      const visible = typeof isOpen !== 'undefined' ? isOpen : getField(this.props, this.state, 'visible');
      if (visible) {
        if (state.match !== this.state.match) {
          this._attemptItemFocus(state.activeIndex);
        }
      } else {
        const value = this._getItemPart(activeItem, itemLabel, itemValue);
        const prevValue = getField(this.props, this.state, 'value');

        if (value !== prevValue && onChange) {
          onChange(value, match, e, { id, name, value });
        }

        if (typeof this.props.value === 'undefined') {
          state.value = value;
        }
      }
    }

    this.setState(state);
  };

  _reduceItems = (items, item, i) => {
    if (item === null) {
      return items;
    }

    const { id, itemLabel, itemValue, position, stripActiveItem } = this.props;
    const below = position === SelectField.Positions.BELOW;
    const value = getField(this.props, this.state, 'value');
    const type = typeof item;

    let props;
    const dataValue = this._getItemPart(item, itemLabel, itemValue);
    const primaryText = this._getItemPart(item, itemLabel, itemValue, true);
    if (type === 'object') {
      props = omit(item, this._deleteKeys);
    }

    const active = dataValue === value || dataValue === parseInt(value, 10);
    const stripped = typeof stripActiveItem !== 'undefined' ? stripActiveItem : below && active;
    if (!stripped) {
      items.push(
        <ListItem
          {...props}
          ref={this._setListItem}
          id={active ? `${id}-options-active` : null}
          active={active}
          tabIndex={-1}
          primaryText={primaryText}
          key={item.key || dataValue}
          role="option"
          data-id={i}
          data-value={dataValue}
        />
      );
    }

    return items;
  };

  render() {
    const {
      id,
      style,
      className,
      listStyle,
      listClassName,
      toggleStyle,
      toggleClassName,
      menuItems,
      anchor,
      belowAnchor,
      fixedTo,
      position,
      xThreshold,
      yThreshold,
      listZDepth,
      listInline,
      listHeightRestricted,
      block,
      centered,
      sameWidth,
      fullWidth,
      repositionOnScroll,
      simplifiedMenu,
      minLeft,
      minRight,
      minBottom,
      fillViewportWidth,
      fillViewportHeight,
      menuTransitionName,
      menuTransitionEnterTimeout,
      menuTransitionLeaveTimeout,
      isOpen, // deprecated
      /* eslint-disable no-unused-vars */
      error: propError,
      menuId: propMenuId,
      visible: propVisible,
      itemLabel,
      itemValue,
      defaultValue,
      defaultVisible,
      onClick,
      onKeyDown,
      deleteKeys,
      stripActiveItem,
      keyboardMatchingTimeout,

      // Deprecated
      defaultOpen,
      initiallyOpen,
      onMenuToggle,
      stretchList,
      menuStyle,
      menuClassName,
      floatingLabel,
      noAutoAdjust,
      adjustMinWidth,
      /* eslint-enable no-unused-vars */
      ...props
    } = this.props;

    let { menuId, listId, error } = this.props;
    error = error || this.state.error;
    if (!menuId) {
      menuId = `${id}-menu`;
    }

    if (!listId) {
      listId = `${menuId}-options`;
    }

    const { listProps, active, activeLabel } = this.state;
    const below = position === SelectField.Positions.BELOW;
    const visible = typeof isOpen !== 'undefined' ? isOpen : getField(this.props, this.state, 'visible');
    const value = getField(this.props, this.state, 'value');
    const useSameWidth = typeof sameWidth !== 'undefined' ? sameWidth : below;

    const toggle = (
      <SelectFieldToggle
        {...props}
        id={id}
        style={toggleStyle}
        className={toggleClassName}
        visible={visible}
        value={value}
        below={below}
        error={error}
        active={active}
        activeLabel={activeLabel}
        onClick={this._toggle}
        onFocus={this._handleFocus}
        onBlur={this._handleBlur}
      />
    );

    return (
      <Menu
        id={menuId}
        listId={listId}
        style={style}
        className={cn('md-menu--select-field', className)}
        listProps={listProps}
        listStyle={listStyle}
        listClassName={listClassName}
        toggle={toggle}
        visible={visible}
        onClose={this._close}
        onKeyDown={this._handleKeyDown}
        onClick={this._handleClick}
        simplified={simplifiedMenu}
        anchor={anchor}
        belowAnchor={belowAnchor}
        fixedTo={fixedTo}
        position={position}
        xThreshold={xThreshold}
        yThreshold={yThreshold}
        listZDepth={listZDepth}
        listInline={listInline}
        listHeightRestricted={listHeightRestricted}
        sameWidth={useSameWidth}
        block={block}
        centered={centered}
        fullWidth={fullWidth}
        minLeft={minLeft}
        minRight={minRight}
        minBottom={minBottom}
        fillViewportWidth={fillViewportWidth}
        fillViewportHeight={fillViewportHeight}
        repositionOnScroll={repositionOnScroll}
        transitionName={menuTransitionName}
        transitionEnterTimeout={menuTransitionEnterTimeout}
        transitionLeaveTimeout={menuTransitionLeaveTimeout}
      >
        {menuItems.reduce(this._reduceItems, [])}
      </Menu>
    );
  }
}
