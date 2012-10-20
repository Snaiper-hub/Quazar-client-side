console.log('ok');
function signIn(){
	if($('#passwordField').val()!=''){
		showLoader();
		settings.login = $('#loginField').val();
		settings.password = $('#passwordField').val();
		saveSetting('login',settings.login);
		settings.autoLogin = $('#autoLogin').prop('checked');
		saveSetting('autoLogin',settings.autoLogin);
		socket.emit('login',{login:settings.login,password:settings.password});
	} else if(settings.login && settings.hash && settings.autoLogin===true){
		socket.emit('login',{login:settings.login,hash:settings.hash});
	} else {
		$('#signInStatus').html("Заполнено не все").fadeIn().fadeOut(2000);
	}
}