/**
 * @class Ext.ux.form.field.MaskField
 * @author Danny Roessner
 *
 * This is a text field that allows an input mask to be specified.
 * Only letters or numbers can be specified as mask characters.
 *
 * The mask can be any string that contains # for a numeric
 * placeholder, the letter A as the alphabetic placeholder,
 * and the symbol * for alphanumeric characters.
 * Complex masks are allowed.
 *
 * Phone: '(###) ###-####'
 * Social Security Number: '###-##-####'
 * Credit Card Number: '####-####-####-####'
 *
 * If a partial value is allowed to be entered into the MaskField,
 * the allowPartial config parameter should be set to true.
 *
 * Here is an example of how to create a Phone mask field.
 *     {
 *         xtype: 'maskfield',
 *         mask: '(###) ###-####'
 *     }  
 */
Ext.define('Ext.ux.form.field.MaskField', {
	extend: 'Ext.form.field.Text',
	alias: 'widget.maskfield',
	/**
	 * The text to display if the validation for this
	 * specific mask does not pass.  This value defaults to:
	 * `Field must be in the following format: [mask]`
	 * @type {String}
	 * @property maskIncompleteText
	 */
	/**
	 * If a mask of (###) ###-#### was specified, the field
	 * value `(212) 555-    ` would be invalid because only
	 * part of the field is populated.  However, if
	 * allowPartial is set to true, the isValid method would
	 * return true.
	 * @type {Boolean}
	 * @property allowPartial
	 */
	allowPartial: false,
	/**
	 * Whether or not the value in the field can be set to "0".
	 * This is important for phone number fields for example.
	 * The server may return a 0, but we don't want to set the
	 * field to "(0  )    -    ".  By default, if `setValue(0)`
	 * or `setValue('0')` is called, is will be interpreted as
	 * `setValue('')`.  If the field should truely be set to `0`,
	 * the allowSetZero configuration property should be set to
	 * true.
	 */
	allowSetZero: false,
	initComponent: function() {
		var me = this,
			mask = me.mask,
			defaultText = mask.replace(/#|A|\*/g, ' '),
			maskArray = [],
			maskIndexArray = [],
			character,
			isComplex = false,
			previousMaskChar,
			currentMaskChar,
			length,
			i;

		length = mask.length;
		for (i = 0; i < length; i++) {
			character = mask.charAt(i);
			if (character === '#' || character === 'A' || character === '*') {
				maskArray[i] = character;
				maskIndexArray.push(i);
			}
		}

		length = maskIndexArray.length;
		for (i = 0; i < length; i++) {
			currentMaskChar = maskArray[maskIndexArray[i]];
			if (currentMaskChar !== previousMaskChar && previousMaskChar) {
				isComplex = true;
			}
			previousMaskChar = currentMaskChar;
		}

		me.defaultText = defaultText;
		me.fieldTextArray = defaultText.split('');
		me.dataIndex = [];
		me.maskArray = maskArray;
		me.maskIndex = maskIndexArray;
		me.insertActive = !isComplex;
		me.highlight = isComplex;
		me.allowInsert = !isComplex;
		me.maskIncompleteText = me.maskIncompleteText || ('Field must be in the following format:<br />' + me.mask);

		me.on('afterrender', function() {
			me.mon(me.getEl(), {
				click: me.initPosition,
				focus: me.initPosition,
				keydown: me.processEvent,
				keyup: me.processEvent,
				change: me.resetIfEmpty,
				paste: me.processPaste,
				scope: me,
				stopEvent: false,
				contextmenu: {
					fn: me.blur,
					scope: me,
					stopEvent: true
				}
			});
		}, me, {
				single: true
			});

		me.callParent(arguments);
	},
	/**
	 * @private
	 * Resets the mask field if the field is empty.
	 * Used internally by the MaskField definition.
	 */
	resetIfEmpty: function() {
		var me = this,
			value = me.getValue();

		if (Ext.String.trim(value) === '') {
			me.setValue('');
		}
	},
	/**
	 * @return {String[]} Array of any validation errors
	 */
	getErrors: function(value) {
		var me = this,
			errors = me.callParent(arguments),
			allowBlank = me.allowBlank,
			allowPartial = me.allowPartial,
			maskIndex = me.maskIndex;

		value = me.data.join('');
		if (value.length === 0 && !allowBlank) {
			errors.push(me.blankText);
		} else if (value.length < maskIndex.length && allowPartial === false && !(value.length === 0 && allowBlank)) {
			errors.push(me.maskIncompleteText);
		}

		return errors;
	},
	setValue: function(value) {
		var me = this,
			maskCharacter,
			character,
			alphaRegex = /\w/i,
			numericRegex = /\d/,
			alphaNumericRegex = /[\w\d]/i,
			length,
			i;

		if (!value && value !== 0) {
			value = '';
		} else {
			value = value.toString();
		}
		value = (!me.allowSetZero && !me.skipZeroCheck && Ext.String.trim(value) === '0') ? '' : value;

		me.data = [];
		if (value) {
			length = value.length;
			for (i = 0; i < length; i++) {
				maskCharacter = me.maskArray[me.maskIndex[i]];
				character = value.charAt(i);

				if ((maskCharacter === '#' && !numericRegex.test(character)) ||
					(maskCharacter === 'A' && !alphaRegex.test(character)) ||
					(maskCharacter === 'A' && !alphaNumericRegex.test(character))) {
					value = '';
					break;
				}
			}

			if (value) {
				length = value.length < me.maskIndex.length ? value.length : me.maskIndex.length;
				for (i = 0; i < length; i++) {
					me.data[me.maskIndex[i]] = value.charAt(i);
				}
				value = me.generateFieldValue();
			}
		}

		if (!value) {
			value = me.fieldTextArray.join('');
		}
		me.updateDataIndex();

		return me.callParent(arguments);
	},
	/**
     * Returns the current data value of the field. The mask is stripped
	 * out.  The getMaskValue method can be used to return the value
	 * of the field with the mask.
     * @return {String} value The field value
     */
	getValue: function() {
		return this.data.join('');
	},
	/**
	 * Returns the full string value in the field without stripping
	 * any data out.
	 * @return {String} value The field value including the mask
	 */
	getMaskValue: function() {
		return this.generateFieldValue();
	},
	/**
	 * @private
	 * Checks to see if the entire field was selected and resets
	 * the MaskField if it was.
	 */
	removeIfSelectAll: function() {
		var me = this,
			textField = Ext.dom.Query.select('INPUT[type=text]', me.el.dom)[0],
			documentRange,
			duplicateRange,
			range,
			isFieldReset;

		if (Ext.isDefined(textField.selectionStart) && Ext.isDefined(textField.selectionEnd) && (textField.selectionEnd - textField.selectionStart === me.fieldTextArray.length)) {
			me.setValue('');
			isFieldReset = true;
		} else if (document.selection) {
			documentRange = document.selection.createRange();
			range = textField.createTextRange();
			duplicateRange = range.duplicate();
			range.moveToBookmark(documentRange.getBookmark());

			if (range.text.length === me.fieldTextArray.length) {
				me.setValue('');
				isFieldReset = true;
			}
		}

		if (!isFieldReset) {
			me.resetIfEmpty();
		}

		return isFieldReset;
	},
	/**
	 * @private
	 * Processes the input field events.
	 */
	processEvent: function(event) {
		var me = this,
			startIdx = null,
			cursorPosition,
			backspaceCursorPosition,
			code = event.keyCode,
			type = event.type,
			down = 'keydown',
			up = 'keyup',
			allowEvent;

		if (me.readOnly) {
			allowEvent = true;
		} else {
			if (!Ext.isDefined(me.maskArray[me.getPosition()[0]])) {
				if (me.dataIndex.length > 0 && me.dataIndex.length !== me.maskIndex.length) {
					startIdx = me.maskIndex[me.dataIndex.length];
				} else if (me.dataIndex.length === me.maskIndex.length) {
					startIdx = me.dataIndex[me.dataIndex.length - 1] + 1;
				} else {
					startIdx = me.maskIndex[0];
				}
				me.setPositionCustom(startIdx);
			}

			if (!((code === Ext.EventObject.TAB && type === down) ||
				(code === Ext.EventObject.ENTER && type === up) ||
				(code === Ext.EventObject.F5 && type === down) ||
				(event.ctrlKey && code === Ext.EventObject.C && type === down) ||
				(event.ctrlKey && code === Ext.EventObject.V && type === down) ||
				(event.ctrlKey && code === Ext.EventObject.A && type === down) ||
				(event.ctrlKey && code === Ext.EventObject.LEFT && type === down) ||
				(event.ctrlKey && code === Ext.EventObject.RIGHT && type === down))) {
				event.preventDefault();

				allowEvent = false;
				if (type === down) {
					if (code === Ext.EventObject.BACKSPACE) {
						if (!me.removeIfSelectAll()) {
							cursorPosition = me.getPosition()[0];

							if (me.allowInsert || (me.getMaskPosition(cursorPosition, -1) === Ext.Array.max(me.dataIndex))) {
								me.moveMask(-1);
								backspaceCursorPosition = me.getPosition()[0];

								if (cursorPosition !== backspaceCursorPosition) {
									me.removeCharacter();
								}
								me.updateFieldValue();
							}
						}
					} else if (code === Ext.EventObject.END) {
						me.setPositionCustom(me.getMaskPosition(me.dataIndex[me.dataIndex.length - 1], 1));
					} else if (code === Ext.EventObject.HOME) {
						me.setPositionCustom(me.maskIndex[0]);
					} else if (code === Ext.EventObject.LEFT || code === Ext.EventObject.UP) {
						me.moveMask(-1);
					} else if (code === Ext.EventObject.RIGHT || code === Ext.EventObject.DOWN) {
						me.moveMask(1);
					} else if (code === Ext.EventObject.INSERT && me.allowInsert) {
						if (me.insertActive) {
							me.insertActive = false;
							me.highlight = true;
						} else {
							me.insertActive = true;
							me.highlight = false;
						}
						me.setPositionCustom(me.getPosition()[0]);
					} else if (code === Ext.EventObject.DELETE) {
						if (!me.removeIfSelectAll()) {
							if (me.insertActive) {
								me.removeCharacter();
							} else {
								if (me.getDataPosition() !== null) {
									me.data[me.dataIndex[me.getDataPosition()]] = '';
								}
							}
							me.updateFieldValue();
						}
					} else if ((me.maskArray[me.getPosition()[0]] === '#' || me.maskArray[me.getPosition()[0]] === '*') && ((code >= Ext.EventObject.ZERO && code <= Ext.EventObject.NINE) || (code >= Ext.EventObject.NUM_ZERO && code <= Ext.EventObject.NUM_NINE))) {
						me.addCharacter(String.fromCharCode((code >= Ext.EventObject.NUM_ZERO && code <= Ext.EventObject.NUM_NINE) ? (code - 48) : code));
						me.updateFieldValue();
						me.moveMask(1);
					} else if ((me.maskArray[me.getPosition()[0]] === 'A' || me.maskArray[me.getPosition()[0]] === '*') && (code >= Ext.EventObject.A && code <= Ext.EventObject.Z)) {
						me.addCharacter(String.fromCharCode(code));
						me.updateFieldValue();
						me.moveMask(1);
					}
				}
			} else {
				allowEvent = true;
			}
		}

		return allowEvent;
	},
	/**
	 * @private
	 * Initializes the cursor position in the field.
	 */
	initPosition: function() {
		var me = this,
			index = me.getMaskPosition(me.getPosition()[0], 0);

		me.setPositionCustom(index);
	},
	/**
	 * @private
	 * Gets the mask position of the input field depening on the direction.
	 */
	getMaskPosition: function(cursorPosition, direction) {
		var me = this,
			length = me.dataIndex.length,
			position = (length > 0) ? cursorPosition : me.maskIndex[0],
			i;

		if (direction === -1) {
			for (i = length - 1; i >= 0; i--) {
				if (me.dataIndex[i] < cursorPosition) {
					position = me.dataIndex[i];
					break;
				}
			}
		} else if (direction === 0) {
			for (i = 0; i < length; i++) {
				if (me.maskIndex[i] >= cursorPosition) {
					position = me.maskIndex[i];
					break;
				} else {
					position = me.maskIndex[length];
				}
			}
		} else if (direction === 1) {
			for (i = 0; i < length; i++) {
				if (me.dataIndex[i] > cursorPosition) {
					position = me.dataIndex[i];
					break;
				}
			}
			if (cursorPosition === me.maskIndex[me.maskIndex.length - 1]) {
				position = cursorPosition + 1;
			} else if (cursorPosition === me.dataIndex[length - 1]) {
				position = me.maskIndex[length];
			}
		}
		return Ext.isDefined(position) ? position : cursorPosition;
	},
	/**
	 * @private
	 * Moves the mask position in the input field.
	 */
	moveMask: function(value) {
		var me = this,
			index = me.getMaskPosition(me.getPosition()[0], value);

		me.setPositionCustom(index);
	},
	/**
	 * @private
	 * Gets the cursor position in the input field.
	 */
	getPosition: function() {
		var me = this,
			positionArray,
			range,
			documentRange,
			duplicateRange,
			ieStart,
			ieEnd,
			textField = Ext.dom.Query.select('INPUT[type=text]', me.el.dom)[0];

		if (Ext.isDefined(textField.selectionStart) && Ext.isDefined(textField.selectionEnd)) {
			positionArray = [textField.selectionStart, textField.selectionEnd];
		} else if (document.selection) {
			documentRange = document.selection.createRange();
			range = textField.createTextRange();
			duplicateRange = range.duplicate();
			range.moveToBookmark(documentRange.getBookmark());
			duplicateRange.setEndPoint('EndToStart', range);

			ieStart = duplicateRange.text.length;
			ieEnd = ieStart + (me.insertActive ? 0 : 1);

			positionArray = [ieStart, ieEnd];
		}
		return positionArray || [0, 0];
	},
	/**
	 * @private
	 * Sets the curosr position in the input field.
	 * Usage of setPosition will override the default setPosition behavior
	 */
	setPositionCustom: function(start) {
		this.selectText(start, start + (this.highlight ? 1 : 0));
	},
	/**
	 * @private
	 * Used internally to add a character to input field.
	 */
	addCharacter: function(character) {
		var me = this,
			cursorPosition = me.getPosition()[0],
			lastPosition,
			currentPosition,
			i;

		if (me.insertActive) {
			lastPosition = me.maskIndex[me.maskIndex.length - 1];
			currentPosition = me.getDataPosition() || 0;
			for (i = lastPosition; i >= currentPosition; i--) {
				me.data[me.maskIndex[i + 1]] = me.data[me.maskIndex[i]];
			}
			me.data[me.maskIndex[currentPosition]] = character;
		} else {
			me.data[cursorPosition] = character;
		}

		me.updateDataIndex();
	},
	/**
	 * @private
	 * Used internally to remove a character from the input field.
	 */
	removeCharacter: function() {
		var me = this,
			lastPosition = me.dataIndex[me.dataIndex.length - 1],
			currentPosition = me.getDataPosition(),
			cursorPosition = me.getPosition()[0],
			i;

		if (currentPosition !== null && lastPosition >= cursorPosition) {
			for (i = currentPosition; i <= lastPosition; i++) {
				me.data[me.dataIndex[i]] = me.data[me.dataIndex[i + 1]];
			}
			me.data.length--;
			me.updateDataIndex();
		}
	},
	/**
	 * @private
	 * Updates the data indexes of the mask field.
	 */
	updateDataIndex: function() {
		var me = this,
			dataIndex = [],
			length = me.data.length,
			i;

		for (i = 0; i < length; i++) {
			if (Ext.isDefined(me.data[i])) {
				dataIndex.push(i);
			}
		}

		me.dataIndex = dataIndex;
	},
	/**
	 * @private
	 */
	getDataPosition: function() {
		var me = this,
			position = me.getPosition()[0],
			dataIndex = null,
			i;

		for (i = 0; i < me.maskIndex.length; i++) {
			if (me.maskIndex[i] === position) {
				dataIndex = i;
				break;
			}
		}
		return dataIndex;
	},
	/**
	 * @private
	 * Generates the new value for the input field.
	 */
	generateFieldValue: function() {
		var me = this,
			newValue = [],
			length = me.maskArray.length,
			i;

		for (i = 0; i < length; i++) {
			if (me.data[i]) {
				newValue.push(me.data[i]);
			} else if (me.fieldTextArray[i]) {
				newValue.push(me.fieldTextArray[i]);
			} else {
				newValue.push(me.maskArray[i]);
			}
		}

		return newValue.join('');
	},
	/**
	 * @private
	 * Updates the input field to the new mask field value.
	 */
	updateFieldValue: function() {
		var me = this,
			position = me.getPosition(),
			length = me.data.length,
			newValue = [],
			i;

		for (i = 0; i < length; i++) {
			if (me.data[i]) {
				newValue.push(me.data[i]);
			}
		}

		me.skipZeroCheck = true;
		me.setValue(newValue.join(''));
		me.skipZeroCheck = false;
		me.setPositionCustom(position[0]);
	},

	processPaste: function(event) {
		var clipBoard = event.browserEvent.clipboardData.getData('Text');
		setTimeout(function() {
			this.setValue(clipBoard);
		}.bind(this), 1);
	}
});