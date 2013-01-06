Ext.Loader.setConfig({
	enabled: true,
	paths: {
		'Ext.ux': 'js/ux'
	}
});

Ext.require('Ext.ux.form.field.MaskField');
Ext.onReady(function() {
	Ext.create('Ext.panel.Panel', {
		title: 'Mask field Examples',
		renderTo: Ext.getBody(),
		bodyPadding: 5,
		width: 500,
		defaults: {
			xtype: 'maskfield',
			labelWidth: 250
		},
		items: [{
			mask: '(###) ###-####',
			fieldLabel: 'Phone ((###) ###-####)',
			width: 355,
			allowBlank: false
		}, {
			xtype: 'maskfield',
			mask: '###-##-####',
			fieldLabel: 'SSN (###-##-####)',
			width: 340,
			allowBlank: false
		}, {
			xtype: 'maskfield',
			mask: '####-####-####-####',
			fieldLabel: 'Credit Card (####-####-####-####)',
			width: 400,
			allowBlank: false
		}, {
			xtype: 'maskfield',
			mask: '##/##/####',
			fieldLabel: 'Date (##/##/####)',
			regex: /^(0?[1-9]|1[012])[\/](0?[1-9]|[12][0-9]|3[01])[\/]\d{4}$/,
			regexText: 'Invalid date.',
			width: 340,
			allowBlank: false
		}, {
			xtype: 'maskfield',
			mask: '#####-####',
			fieldLabel: 'Zip Code (#####-####)',
			allowPartial: true,
			validator: function() {
				var value = this.getValue(),
					length = value.length,
					error;

				if (value && ((length < 5 && length > 0) || (length > 5 && length < 9))) {
					error = 'Invalid zip code.';
				}

				return error || true;
			},
			width: 350
		}, {
			xtype: 'maskfield',
			mask: '$###,###.##',
			fieldLabel: 'Money ($###,###.##)',
			width: 340,
			allowBlank: false
		}, {
			xtype: 'maskfield',
			mask: '***-*****',
			fieldLabel: 'ID Code (***-*****)',
			width: 340,
			allowBlank: false
		}, {
			xtype: 'maskfield',
			mask: 'A#### ##### #####',
			fieldLabel: 'License # (A#### ##### #####)',
			width: 390,
			allowBlank: false
		}]
	});
});