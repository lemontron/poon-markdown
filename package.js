Package.describe({
	name: 'poon-markdown',
	version: '1.0.0',
	summary: 'Poon React markdown renderer',
});

Package.onUse(api => {
	api.use('ecmascript', 'client');
	api.use('modules', 'client');
	api.mainModule('index.js', 'client');
});
