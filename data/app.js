var app = require('appjs');

app.serveFilesFrom(__dirname + '/content');

var trayMenu = app.createMenu([{
  label:'Показать',
  action:function(){
    window.frame.show();
  },
},{
  label:'Скрыть',
  action:function(){
    window.frame.hide();
  }
},{
  label:'Закрыть',
  action:function(){
    window.close();
  }
}]);

var statusIcon = app.createStatusIcon({
  icon:'./data/content/icons/16.png',
  tooltip:'Quazar',
  menu:trayMenu
});

var window = app.createWindow({
	width: 800,
	height: 700,
	icons: __dirname + '/content/icons'
	//showChrome     : false
	/***************************** defaults ********************************
	 * url            : 'http://appjs', // serve static file root and routers
	 * autoResize     : false,          // resizes in response to html content
	 * showChrome     : true,           // show border and title bar
	 * resizable      : false,          // control if users can resize window
	 * disableSecurity: true,           // allow cross origin requests
	 * opacity        : 1,              // flat percent opacity for window
	 * alpha          : false,          // per-pixel alpha blended (Win & Mac)
	 * fullscreen     : false,          // client area covers whole screen
	 * left           : -1,             // centered by default
	 * top            : -1,             // centered by default
	 *************************************************************************/
});

window.on('create', function () {
	console.log("Window Created");
	this.frame.show().center();
});

window.on('ready', function () {
	console.log("Window Ready");
	window.require = require;
	window.process = process;
	window.module = module;
	window.__dirname = __dirname;
	window.addEventListener('keydown', function (e) {
		if (e.keyIdentifier === 'F12') {
			window.frame.openDevTools();
		}
	});
});

window.on('close', function () {
	console.log("Window Closed");
});