Package.describe({
	name: 'poon-markdown',
	version: '1.0.0',
	summary: 'Poon React markdown renderer',
});

Package.onUse(api => {
	api.use('ecmascript');
	api.use('modules');
	api.mainModule('index.js');
});
