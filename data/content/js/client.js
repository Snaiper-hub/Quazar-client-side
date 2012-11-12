$(window).on('app-ready',function(){
	var fs = require('fs');
	var mime = require('mime');
	var path = require('path');
	var net = require('net');
	var socket;
	var rc = false;
	
	$('body').on('contextmenu', function(e){
		var el = e.srcElement;
		if(el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {} else {
			e.preventDefault();
			$("#contextmenu").hide();
		}
	});
	
	$('body').on('mousedown','#textareaResizer',function(event){
		var mouseStart = event.pageY;
		var tH = $('#messageField').height();
		$('body').mousemove(function(e){
			var h = tH + (mouseStart-e.pageY);
			if( h >= 36 && h <= 200 ){
				$('#messageField').height(h);
				$('#messages').css("padding-bottom",100+h);
				 
				var $el=$('#messages').find('.currentChannel');
				var height = $el[0].scrollHeight;
				$el.animate({scrollTop: height + "px"}, 0);
			}
		});
	}).mouseup(function(){
		$('body').unbind('mousemove');
    }).mouseleave(function(){
		$('body').unbind('mousemove');
	});
	
	$(document).on('click', function(e){
		if ($(e.target).closest('#settingsButton').length !== 0){
			$('#contextmenu').show().css({
				left:e.pageX,
				top:e.pageY
			});
		} else {
			$("#contextmenu").hide();
		}
	});

	
	function serverConnect(rc) {
		$('#loader').fadeIn();
		if(rc){
			socket.socket.connect();
			console.log('reConnecting...');
		} else {
			socket = io.connect('http://10.50.101.28:8800/');
			console.log('connecting...');
		}
	}
	
	serverConnect();
	
socket.on('connect', function(){
	
	var currentChannel = '';
	var currentSpeakers = [];
	
/*		Настройки		*/

	var settings = getSettingsObject();
	
	function getSettingsObject(){
		var settingsObject;
		var sPath = __dirname+'\\settings.json';
		if(!fs.existsSync(sPath)){
			fs.open(sPath,'w+',function(err, file_handle){
				fs.writeSync(file_handle,'{}',null,'utf8');
			});
			settingsObject = {}
		} else {
			var contents = fs.readFileSync(sPath,'utf8');
			settingsObject = JSON.parse(contents);
		}
		return settingsObject;
	}
	
	function saveSetting(settingName,value){
		settings[settingName] = value;
		var string = JSON.stringify(settings);
		fs.writeFileSync(__dirname+'\\settings.json',string,'utf8');
	}
	
/*		Настройки - Конец		*/
	
	
/*		Эффекты		*/

	function scroll() {
		var $el=$('#messages').find('.currentChannel');
		var height = $el[0].scrollHeight;
		$el.animate({scrollTop: height + "px"}, {queue: false});
	}
	
	function showLoader(){
		$('#loader').fadeIn();
	}
	
	function hideLoader(){
		$('#loader').fadeOut();
	}
	
/*		Эффекты - Конец		*/


/*			Регистрация			*/

	function showRegistration(){
		$('#loginPanel').slideUp(function(){
			$('#registrationPanel').slideDown();
		});
	}
	
	function isValidEmailAddress(emailAddress) {
		var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
		return pattern.test(emailAddress);
    }

	function regSubmit() {
		var login = $('#regLoginField').val();
		var password = $('#regPasswordField').val();
		var mail = $('#regEmailField').val();		
		if(login == '' || password == '' || mail == ''){
			$('#regStatus').html('Надо заполнить полностью!').fadeIn().delay(1000).fadeOut(2000);
		} else if(password.length<6){
			$('#regStatus').html('Пароль должен быть больше 6 символов!').fadeIn().fadeOut(2000);
		} else if(!isValidEmailAddress(mail)){
			$('#regStatus').html('Адрес почты некорректен').fadeIn().delay(1000).fadeOut(2000);
		} else {
			socket.emit('userRegistration',{'login' : login,'password' : password,'email' : mail});
		}
	}
	
	function onRegistrationSuccess(data){
		$('#regStatus').html('OK').fadeIn().delay(1000).fadeOut(2000);		
	}
	
	function onRegistrationFailed(){
		$('#regStatus').html('Fail').fadeIn().delay(1000).fadeOut(2000);
	}
	
/*			Регистрация - Конец			*/


/*			Профиль			*/

	function saveProfileInfo(){
		var userName = $('#userName').val();
		var userSurname = $('#userSurname').val();
		var userBirthday = $('#userBirthday').val();
		socket.emit('profileInfo',{login:settings.login,userName:userName,userSurname:userSurname,userBirthday:userBirthday});
	}
	
	$('#avatarSelector').click(function(){
		window.frame.openDialog({
			type:'open',
			acceptTypes: { Images:['*.jpg','*.png'] },
			multiSelect:false,
			dirSelect:false
		},function(err,files){
			if(!err){
				var file = files[0];
				var type = mime.lookup(file);
				var stat = fs.statSync(file);
				var name = path.basename(file);
				var img = fs.readFileSync(file).toString('base64');
					$('#hidePhoto').attr('src','data:'+type+';base64,' +img).load(function(){
						var photo = document.getElementById('hidePhoto');
						
						var canvas=document.getElementById('photo');
						
						var photoAreaW = 400;
						var photoAreaH = 400;
						// size photo area
						
						var hW = $('#hidePhoto').width();
						var hH = $('#hidePhoto').height();
						// get size of a hidden photo
						
						var ctx=canvas.getContext('2d');
						
						var ratio;
						var ratioW = photoAreaW/hW;
						var ratioH = photoAreaH/hH;
						// ratio
						// где то тут можно использвать Math.max(...)
						if(hW > photoAreaW || hH > photoAreaH ){
							if(ratioW < ratioH){
								ratio = ratioW;
							}
							if(ratioW > ratioH){
								ratio = ratioH;
							}
							canvas.width = hW*ratio;
							canvas.height = hH*ratio;
						} else {
							canvas.width = hW;
							canvas.height = hH;
						}
						
						ctx.drawImage(photo,0,0,canvas.width, canvas.height);
						
						var w = $('#photoArea');
						$('#photo').css('top',(w.height()-$('#photo').height())/2 + 'px');
						$('#photo').css('left',(w.width()-$('#photo').width())/2 + 'px');
						
						var dataURL = canvas.toDataURL();
				});	
			} else {
				console.log('error in image selection');
			}
		});
	});
	
/*			Профиль - Конец			*/


/*			Сообщения			*/

	function handleMessage(data){
		var channel=data.channel; 
		var dateString='<span>'+data.date.hours+':'+data.date.mins+'</span>';
		var content=data.content;
		if(data.login===settings.login){
			var authorString='<span class="author me">'+settings.login+'</span>';
		}else{
			var authorString='<span class="author">'+data.login+'</span>';
		}
		if(data.login===currentSpeakers[channel]){
			$('.channelContainer[data-channel='+channel+'] .messageContent').last().append('<br />'+content);
		}else{
			$('.channelContainer[data-channel='+channel+']').append('<div class="message"><div class="messageInfo">'
			+authorString+dateString+'</div><div class="messageContent">'+content+'</div></div>');
			currentSpeakers[channel]=data.login;
		}
		scroll();
	}
	
	function submitMessage(){
		var message=$('#messageField').val();
		$('#messageField').focus();
		if(message !== ''){
			$('#messageField').val('');
			socket.emit('message',{content:message,channel:currentChannel});
		}
	}
	
	function fromUser(){
		var name = $(this).text();
		if(name !== settings.login){
			var message = $('#messageField').val();
			if(message){
				$('#messageField').val(message + ' ' + name);
			} else {
				$('#messageField').val(name + ' ');
			}
		} else return false;
	}

/*			Сообщения - Конец			*/
	
	
/*			Авторизация			*/
	$('#loginField').val(settings.login);
	$('#autoLogin').prop('checked', settings.autoLogin);
	
	if(settings.login && settings.hash && settings.autoLogin===true){
		signIn();
	} else {
		hideLoader();
		$('#loginPanel').slideDown();
	}

	function signIn() {
		if($('#passwordField').val()!=''){
			showLoader();
			settings.login = $('#loginField').val();
			var password = $('#passwordField').val();
			saveSetting('login',settings.login);
			settings.autoLogin = $('#autoLogin').prop('checked');
			saveSetting('autoLogin',settings.autoLogin);
			socket.emit('login',{login:settings.login,password:password});
		} else if(settings.login && settings.hash && settings.autoLogin===true){
			socket.emit('login',{login:settings.login,hash:settings.hash});
		} else {
			$('#signInStatus').html('Заполнено не все').fadeIn().delay(1000).fadeOut(2000);
		}
	}
	
	function loginError(error){
		$('#loginPanel').slideDown();
		hideLoader();
		$('#signInStatus').html(error).fadeIn().delay(1000).fadeOut(3000);
	}
	
	function onLoginSuccess(data){
		$('#userBar').html(settings.login);
		$('#overlay').fadeOut();
		$('#signInStatus').removeClass().html('').hide();
		$('#loginPanel').fadeOut();
		$('#serverOffline').fadeOut();
		$('#pageContainer').fadeIn();
		$('#userName').val(data.profileInfo.name);
		$('#userSurname').val(data.profileInfo.surname);
		$('#userBirthday').val(data.profileInfo.birthday);
		
		if(data.hash && settings.autoLogin===true) saveSetting('hash',data.hash);
	}
	
	function onLoginFinish(){
		hideLoader();
	}
	
	function showSignInForm(){
		$('#registrationPanel').slideUp(function(){
			$('#loginPanel').slideDown();
		});
	}
	
	function logOut(){
		$('#overlay').fadeIn();
		$('#loginPanel').fadeIn();
		$('#channelsRow').children().remove();
		$('.channelContainer').remove();
		$('.channelOnlineContainer').remove();
		$('#messages').children().remove();
		$('#autoLogin').removeAttr('checked');
		saveSetting('hash','');
		saveSetting('autoLogin','');
		socket.emit('logOut');
	}
	
/*			Авторизация - Конец			*/


/*			Действия			*/
	
	$('[data-action=open]').click(function(){
		$('#overlay').fadeIn();
		var page = $(this).data('page');
		$('#'+page).fadeIn();
	});
	
	function openChannelsList(data){
		$('#overlay').fadeIn();
		$('#channelsList').html('');
		data.channels.forEach(function(channel){
			$('#channelsList').append('<div class="channel">' + channel.name + '</div>');
		});
		$('#channels').fadeIn();
	}
	
	$('[data-action=close]').click(function(){
		var page = $(this).closest('.page');
		$('#overlay').fadeOut(function(){
			page.fadeOut();
		});
	});
	function settingsListClick(){
		var index = $('#settingsDivisionsList li').index(this);
		var width = $('.settingsDivisionPage').first().width();
		$('#settingsDivisionsList').find('.activeTabItem').removeClass('activeTabItem');
		$(this).addClass('activeTabItem');
		$('#settingsDivisionsPages').animate({scrollLeft:index*width},{queue:false});
	}
	
/*			Действия - Конец			*/	


/*			Каналы			*/

	function parseChannel(data){
		var channels = data.channels;
		for(var i = 0;i<channels.length;i++){
			var online = channels[i].online;
			var name = channels[i].name;
			var header = channels[i].header;
			
			$('#channelsRow').append('<div class="channelListItem" data-channel="'+name+'">'+name+'<span class="channelLeave"></span></div>');
			$('#messages').append('<div class="channelContainer" data-channel="'+name+'"></div>');
			currentSpeakers[name] = '';
			$('.channelContainer[data-channel='+name+']').append('<div class="channelTopic">'+header+'</div>');
		
			if(i===0 && channels.length>1){
				currentChannel = name;
				$('#channelsRow').children('div').first().addClass('currentChannel activeTabItem');
				$('.channelContainer').first().addClass('currentChannel');
				$('#channelOnlineTab').append('<div class="channelOnlineContainer currentChannel" data-channel="'+name+'"></div>');
			}else{
				$('#channelOnlineTab').append('<div class="channelOnlineContainer" data-channel="'+name+'"></div>');
			}
			
			for(var ii = 0;ii<online.length;ii++){
				$('.channelOnlineContainer[data-channel='+name+']').append('<div class="user" data-login="'+online[ii]+'">'+online[ii]+'</div>');
			}
		}
	}
	
	function getChannels(){
		socket.emit('getChannels');
	}
	
	function addChannel(){
		var name = $('#addChannelField').val();
		if(name.length >= 3){
			$('#addChannelField').val('');
			socket.emit('createChannel',{channel:name});
		}else{
			// добавить предупреждение
		}
	}
	
	function joinChannel(){
		var name = $(this).html();
		socket.emit('channelJoin',{login:settings.login,channel:name});
	}

	function privateChannel(data){
		var chName;
		if(data.from !== undefined){
			if($('.channelListItem[data-channel='+data.name+']').length){
				$('.channelListItem[data-channel='+data.name+']').click();
			} else {
				$('#privatesRow').slideDown().append('<div class="channelListItem" data-channel="'+data.name+'">'+data.from+'<span class="channelLeave"></span></div>').click();
				$('#messages').append('<div class="channelContainer" data-channel="'+data.name+'"></div>');
			}
		} else {
			var user = $(this).attr('data-login');
			if(settings.login !== user){				
				chName = [settings.login, user].sort().join("");				
				if($('.channelListItem[data-channel='+chName+']').length){
					$('.channelListItem[data-channel='+chName+']').click();
				} else {
					socket.emit('privateChInitialization',{to:user,name:chName});
					
					$('#privatesRow').slideDown().append('<div class="channelListItem" data-channel="'+chName+'">'+user+'<span class="channelLeave"></span></div>').click();
					$('#messages').append('<div class="channelContainer" data-channel="'+chName+'"></div>');
					$('.channelListItem[data-channel='+chName+']').click();
				}
			}
		}
	}

	function channelClick(){
		$('div.channelContainer[data-channel='+currentChannel+']').hide();
		$('.channelOnlineContainer[data-channel='+currentChannel+']').hide();
		
		currentChannel = $(this).attr("data-channel");
		
		$('.currentChannel').removeClass('currentChannel activeTabItem');
		$('div.channelContainer[data-channel='+currentChannel+']').addClass('currentChannel').show();
		$('.channelOnlineContainer[data-channel='+currentChannel+']').addClass('currentChannel').show();
		$('.channelListItem[data-channel='+currentChannel+']').addClass('currentChannel activeTabItem');
	}
	
	function channelLeave(){
		var channel = $(this).parent().attr('data-channel');
		socket.emit('channelLeave',{channel:channel});
		if($(this).parent('.channelListItem').next().length){
			$(this).parent('.channelListItem').next().click();
		}else{
			$(this).parent('.channelListItem').prev().click();
		}
		$('*[data-channel='+channel+']').remove();		
	}
	
	function handleUserJoin(data){
		var channel = data.channel;
		var user = data.login;
		$('.channelContainer[data-channel='+channel+']').append('<div class="message"><span class="author">'+user+'</span> присоединился к каналу...</div>');
		$('.channelOnlineContainer[data-channel='+channel+']').append('<div class="user "data-login="'+user+'">'+user+'</div>');
		scroll();
		currentSpeakers[channel]='';
	}
	
	function handleUserLeave(data){
		var channel = data.channel;  
		if(channel !== ''){
			var user = data.login;
			$('.channelContainer[data-channel="'+channel+'"]').append('<div class="message"><span class="author">'+user+'</span> покинул канал...</div>');
			$('.channelOnlineContainer[data-channel='+channel+']').children('div[data-login='+user+']').remove();
		}
		scroll();
		currentSpeakers[channel]='';
	}
	
	function tabSwitch(){
		var index = $('#channelTabs a').index(this);
		$('.activeTab').removeClass('activeTab activeTabItem');
		$(this).addClass('activeTab activeTabItem');
		$('#tabs').animate({scrollLeft:index*400},{queue:false});
	}
	
/*			Каналы - Конец			*/
	
	
/*			События			*/

	socket.on('loginSuccessful',onLoginSuccess);
	socket.on('registrationSuccessful',onRegistrationSuccess);
	socket.on('registrationFailed',onRegistrationFailed);
	socket.on('profileInfoUpdateSuccessful');
	socket.on('profileInfoUpdateFailed');
	socket.on('loginError',loginError);
	socket.on('message',handleMessage);
	socket.on('userJoined',handleUserJoin);
	socket.on('userLeaved',handleUserLeave);
	socket.on('sendChannel',parseChannel);
	socket.on('loginProcedureFinish',onLoginFinish);
	socket.on('allChannels',openChannelsList);
	socket.on('privateChInitialization',privateChannel);
	$('#profileSave').click(saveProfileInfo);
	$('#settingsDivisionsList li').click(settingsListClick);
	$('#openChannels').click(getChannels);
	$('#sendMessage').click(submitMessage);
	$('#messageField').keypress(function(e){if(e.which===13){submitMessage();return false;}});
	$('.channel').live('dblclick',joinChannel);
	$('#rightColumnHeader').on('click','.channelListItem',channelClick);	
	$('#rightColumnHeader').on('click','.channelLeave',channelLeave);
	// лайв нужен, ничего зазорного
	$('#channelTabs').on('click','a',tabSwitch);
	$('#createChannel').on('click',addChannel);
	$('#signIn').on('click',signIn);
	$('#registration').on('click',showRegistration);
	$('#showLoginPanel').on('click',showSignInForm);
	$('#regSubmit').on('click',regSubmit);
	$('#messages').on('click','.author',fromUser);
	$('#tabsWrapper').on('dblclick','.user',privateChannel);
	$('#logOut').on('click',logOut);
	
/*		События	- Конец		*/
	
});
	socket.on('error', function(){
		$('#loader').fadeOut();
		$('#serverOffline').slideDown();
		setTimeout(function(){serverConnect(true);}, 20000);
		console.log('Ошибка соединения');
	});
	socket.on('disconnect', function(){
		$('#overlay').fadeIn();
		$('#channelsRow').children().remove();
		$('.channelContainer').remove();
		$('.channelOnlineContainer').remove();
		$('#messages').children().remove();
		$('#serverOffline').slideDown();
		//setTimeout(function(){serverConnect(true);}, 60000);
		// само коннектится по экспоненте, при раскомменчивании возможно 2 реконнекта
		console.log('Дисконнект');
	});
});
