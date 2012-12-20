$(window).on('app-ready',function(){
	var mime = require('mime');
	var path = require('path');
	var fs = require('fs');
	var child_process = require('child_process');
	
	var Render = function(){
		this.GetFieldValue = function(field){
			return $('#'+field).val();
		};
		this.SetMessageFieldValue = function(value){
			$('#messageField').val(value);
		}
		this.GetMessageFiledValue = function(){
			return $('#messageField').val();
		}
		this.ShowContextMenu = function(event){
			var el = event.target;
			if(event.type === 'contextmenu'){
				if(el.type !== 'textarea' && el.type !== 'text'){
					event.preventDefault();
				}
				console.log(event);
				if (el.className === 'user' || $(el).hasClass('friend')){
					var name = $(el).html();
					if(name === settings.login){
						$('#userContextMenu').hide();
						return false;
					}
					var friendClick = $(el).hasClass('friend');
					if(friendClick){
						$('#addToFriends').hide();
						$('#deleteFromFriends').show();
					}else{
						$('#deleteFromFriends').hide();
						$('#addToFriends').show();
					}
					$('#userContextMenu').css({
						left:event.pageX,
						top:event.pageY
					}).show();
					PeopleManager.SelectedUser = name;
				}else if(el.className === 'notActiveMenuItem'){
					return false;
				}
			} else {
				$('#userContextMenu').hide();
				if($('#otherNotification').filter(':visible').length){
					$('#otherNotification').stop(true,true).delay(1500).fadeOut(function(){
						$('#calendar').fadeIn();
						$('#transferInfo').children('div').empty();
					});
				}
			}
		}
		this.HideContextMenu = function(){
			$('#userContextMenu').hide();
		}
		this.FadeIn = function(id){
			$('#'+id).fadeIn();
		}
		this.FadeOut = function(id){
			$('#'+id).fadeOut();
		}
		this.ShowLoginPanel = function(){
			$('#loginPanel').slideDown();
		}
		this.HideLoginPanel = function(){
			$('#loginPanel').slideUp();
		}
		this.ShowSignInForm = function(){
			$('#registrationPanel').slideUp(function(){
				Render.ShowLoginPanel();
			});
		}
		this.Scroll = function(){
			var $el=$('#messages').find('.currentChannel');
			var height = $el[0].scrollHeight;
			$el.animate({scrollTop: height + "px"}, {queue: false});
		}
		this.ShowRegistration = function(){
			$('#loginPanel').slideUp(function(){
				$('#registrationPanel').slideDown();
			});
		}
		this.ShowRegistrationStatus = function(status){
			$('#regStatus').html(status).fadeIn().delay(1000).fadeOut(2000);
		}
		this.ShowSignInStatus = function(status){
			$('#signInStatus').html(status).fadeIn().delay(1000).fadeOut(2000);
		}
		this.ShowFileTransferNotification = function(data){
			$('#from').html(data.from);
			$('#fileName').html(data.file.name);
			$('#fileSize').html(data.file.size);
			$('#calendar').fadeOut();
			$('#SenderFileTransferNotification').fadeOut();
			$('#fileTransferNotification').fadeIn();
		}
		this.ShowSenderFileTransferNotification = function(data){
			$('#toUser').html('Ожидание подтверждения от '+data);
			$('#fileTransferNotification').fadeOut();
			$('#fileTransferStatus').fadeOut();
			$('#calendar').fadeOut();
			$('#SenderFileTransferNotification').fadeOut().fadeIn();
		}
		this.OtherNotification = function(data){
			$('#fileTransferNotification').fadeOut();
			$('#fileTransferStatus').fadeOut();
			$('#calendar').fadeOut();
			$('#SenderFileTransferNotification').fadeOut();
			$('#bar').css('width','0px');
			$('#otherNotification').html(data).fadeIn();
		}
		this.ShowFileTransferStatus = function(filename){
			$('#fileTransferNotification').fadeOut();
			$('#calendar').fadeOut();
			$('#fileTransferStatus').fadeIn();
			$('#transferFileName').html(filename);
		}
		this.UpdateFileTransferProgress = function(bytesWritten,fileSize,speed){
			$('#SenderFileTransferNotification').fadeOut();
			var width = $('#progress').width();
			var barWidth = Math.round((bytesWritten/fileSize)*width);
			$('#bar').css('width',barWidth+'px');
			if(speed){
				$('#transferSpeed').html(speed);
			}
		}
		this.OpenWindow = function(){
			$('#overlay').fadeIn();
			var page = $(this).data('page');
			$('#'+page).fadeIn();
		};
		this.CloseWindow = function(){
			var page = $(this).closest('.page');
			$('#overlay').fadeOut(function(){
				page.fadeOut();
			});
		};
		this.SwitchSettingsPage = function(){
			var index = $('#settingsDivisionsList').find('li').index(this);
			var width = $('.settingsDivisionPage').first().width();
			$('#settingsDivisionsList').find('.activeTabItem').removeClass('activeTabItem');
			$(this).addClass('activeTabItem');
			$('#settingsDivisionsPages').animate({scrollLeft:index*width},{queue:false});
		};
		this.PeopleTabsSwitch = function(){
			var index = $('#channelTabs').find('a').index(this);
			$('.activeTab').removeClass('activeTab activeTabItem');
			$(this).addClass('activeTab activeTabItem');
			$('#tabs').animate({scrollLeft:index*400},{queue:false});
		};
		this.RenderChannels = function(data){
			var channels = data.channels;
			for(var i = 0;i<channels.length;i++){
				var online = channels[i].online;
				var name = channels[i].name;
				var header = channels[i].header;
				$('#channelsRow').append('<div class="channelListItem" data-channel="'+name+'">'+name+'<span class="channelLeave"></span></div>');
				$('#messages').append('<div class="channelContainer" data-channel="'+name+'"></div>');
				ChannelsManager.CurrentSpeakers[name] = '';
				$('.channelContainer[data-channel='+name+']').append('<div class="channelTopic">'+header+'</div>');
				if(i===0){
					ChannelsManager.CurrentChannel = name;
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
		};
		
		this.RenderUser = function(user,channel){
			$('.channelContainer[data-channel='+channel+']').append('<div class="message"><span class="author">'+user+'</span> присоединился к каналу...</div>');
			$('.channelOnlineContainer[data-channel='+channel+']').append('<div class="user"data-login="'+user+'">'+user+'</div>');
		}
		
		this.RemoveUser = function(user,channel){
			$('.channelContainer[data-channel="'+channel+'"]').append('<div class="message"><span class="author">'+user+'</span> покинул канал...</div>');
			$('.channelOnlineContainer[data-channel='+channel+']').children('div[data-login='+user+']').remove();
		}
		this.RenderFriends = function(friends){
			if(friends.length){
				friends.forEach(function(friend){
					var online = friend.online ? 'online' : 'offline';
					$('#peopleTab').append('<div data-name="'+friend.name+'" class="friend '+online+'">'+friend.name+'</div>');
				});				
			}
		}
		this.RenderFriend = function(data){
			// пока по-умолчанию считаем что он онлайн, но вообще надо как-то уменй делать
			$('#peopleTab').append('<div data-name="'+data.name+'" class="friend online">'+data.name+'</div>');
		}
		this.RemoveFriend = function(data){
			$('.friend[data-name='+data.name+']').remove();
		}

		this.RenderChannelsList = function(data){
			var channels = new Array();
			data.channels.forEach(function(channel){
				channels.push('<div class="channel">' + channel.name + '</div>');
			});
			$('#channelsList').html(channels.sort().join(''));
		};
		
		
		
		this.OnMessageFieldResize = {};
		this.OnMessageFieldResize.MouseDown = function(event){
			var mouseStart = event.pageY;
			var tH = $('#messageField').height();
			$('body').mousemove(function(e){
				var h = tH + (mouseStart-e.pageY);
				if( h >= 36 && h <= 200 ){
					$('#messageField').height(h);
					$('#messages').css('padding-bottom',100+h);
					var $el=$('#messages').find('.currentChannel');
					var height = $el[0].scrollHeight;
					$el.css({scrollTop: height + "px"});
				}
			});
		};
		this.OnMessageFieldResize.MouseUp = function(){
			$('body').unbind('mousemove');
		};
		this.OnMessageFieldResize.MouseLeave = function(){
			$('body').unbind('mousemove');
		};
	};
	
	var SocketManager = function(){
		this.OnError = function(){
			Render.FadeOut('loader');
			$('#serverOffline').slideDown();
			setTimeout(function(){SocketManager.ServerConnect(true);}, 20000);
			console.log('Ошибка соединения');
		};
		this.OnConnect = function(){
			console.log('connected');
			if(settings.login && settings.hash && settings.autoLogin===true){
				AuthorizationManager.SignIn();
			} else {
				Render.FadeOut('loader');
				Render.ShowLoginPanel();
			}
		};
		this.OnDisconnect = function(){
			$('#overlay').fadeIn();
			$('#channelsRow').children().remove();
			$('.channelContainer').remove();
			$('.channelOnlineContainer').remove();
			$('#messages').children().remove();
			$('#serverOffline').slideDown();
			//setTimeout(function(){serverConnect(true);}, 60000);
			// само коннектится по экспоненте, при раскомменчивании возможно 2 реконнекта
			console.log('Дисконнект');
		};
		this.ServerConnect = function(rc){
			Render.FadeIn('loader');
			if(rc){
				socket.socket.connect();
				console.log('reConnecting...');
			} else {
				socket = io.connect('http://10.50.101.28:8800/');
				console.log('connecting...');
			}
		}
	};
	
	var SettingsManager = function () {
		this.GetSettingsObject = function(){
			var settingsObject;
			var sPath = __dirname+'\\settings.json';
			if(!fs.existsSync(sPath)){
				fs.open(sPath,'w+',function(err, file_handle){
					fs.writeSync(file_handle,'{}',null,'utf8');
				});
				settingsObject = {};
			} else {
				var contents = fs.readFileSync(sPath,'utf8');
				settingsObject = JSON.parse(contents);
			}
			return settingsObject;
		};
		this.SaveSetting = function(settingName,value){
			settings[settingName] = value;
			var string = JSON.stringify(settings);
			fs.writeFileSync(__dirname+'\\settings.json',string,'utf8');
		};
	};
	
	
	var RegistrationManager = function(){
		this.RegistrationSubmit = function(){
			function isValidEmailAddress(emailAddress){
				var pattern = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);//HTML5 standart based
				return pattern.test(emailAddress);
			}
			var login = Render.GetFieldValue('regLoginField');
			var password = Render.GetFieldValue('regPasswordField');
			var mail = Render.GetFieldValue('regEmailField');
			if(login === '' || password === '' || mail === ''){
				Render.ShowRegistrationStatus('Надо заполнить полностью!');
			} else if(password.length<6){
				Render.ShowRegistrationStatus('Пароль должен быть больше 6 символов!');
			} else if(!isValidEmailAddress(mail)){
				Render.ShowRegistrationStatus('Адрес почты некорректен');
			} else {
				socket.emit('userRegistration',{'login' : login,'password' : password,'email' : mail});
			}
		};
		this.OnRegistrationSuccess = function(){
			Render.ShowSignInForm();
		};
		this.OnRegistrationFailed = function(data){
			Render.ShowRegistrationStatus(data);
		};
	};
	var ProfileManager = function(){
		this.SaveProfileInfo = function(){
			var userName = Render.GetFieldValue('userName');
			var userSurname = Render.GetFieldValue('userSurname');
			var userBirthday = Render.GetFieldValue('userBirthday');
			var userPhoto = document.getElementById('photo').toDataURL();
			socket.emit('profileInfo',{login:settings.login,userName:userName,userSurname:userSurname,userBirthday:userBirthday,userPhoto:userPhoto});
			Render.FadeOut('overlay');
		};
		this.OnAvatarSelect = function(){
			var options = {type:'open', acceptTypes: { Images:['*.jpg','*.png'] }, multiSelect:false, dirSelect:false};
			var onDialogClose = function(err,files){
				if(!err){
					var file = files[0];
					var type = mime.lookup(file);
					var stat = fs.statSync(file);
					var name = path.basename(file);
					var img = fs.readFileSync(file).toString('base64');
						$('#hidePhoto').attr('src','data:'+type+';base64,' +img).load(function(){
							var photo = document.getElementById('hidePhoto');
							var canvas = document.getElementById('photo');
							var photoAreaW = 400;
							var photoAreaH = 400;
							// size photo area
							var hW = $('#hidePhoto').width();
							var hH = $('#hidePhoto').height();
							// get size of a hidden photo
							var ctx=canvas.getContext('2d');
							var ratioW = photoAreaW/hW;
							var ratioH = photoAreaH/hH;
							// ratio
							if(hW > photoAreaW || hH > photoAreaH ){
								var ratio = Math.min(ratioW,ratioH);
								canvas.width = hW*ratio;
								canvas.height = hH*ratio;
							} else {
								canvas.width = hW;
								canvas.height = hH;
							}
							ctx.drawImage(photo,0,0,canvas.width, canvas.height);
							$('#photo').css('top',(photoAreaH-canvas.height)/2 + 'px');
							$('#photo').css('left',(photoAreaW-canvas.width)/2 + 'px');
					});
				} else {
					console.log('error in image selection');
				}
			};
			window.frame.openDialog(options,onDialogClose);
		};
		
		this.rotatePhoto = function(degree){
			var canvas = document.getElementById('photo');
			var ctx = canvas.getContext('2d');
			var img = new Image();
			img.src = canvas.toDataURL();

			var width = canvas.width;
			var height = canvas.height;
			canvas.width = height;
			canvas.height = width;

			img.onload = function(){
				ctx.translate(canvas.width/2,canvas.height/2);
				ctx.rotate(degree*Math.PI/180);
				ctx.drawImage(img,-canvas.height/2,-canvas.width/2);
			}

			var w = $('#photoArea');
			$('#photo').css('top',(w.height()-canvas.height)/2 + 'px');
			$('#photo').css('left',(w.width()-canvas.width)/2 + 'px');
		}
		
		this.OnProfileInfoUpdateSuccessful = function(){
			//
		};

		this.OnProfileInfoUpdateFailed = function(){
			//
		};
	};
	var MessageHandler = function(){
		this.OnMessage = function(data){
			var channel = data.channel;
			var dateString = '<span>'+data.date.hours+':'+data.date.mins+'</span>';
			var authorString = '';
			var content = '';
			if(data.img === true){
				content = '<img src="">';
			} else {
				content = data.content;
			}
			if(data.login === settings.login){
				authorString='<span class="author me">'+settings.login+'</span>';
			}else{
				authorString='<span class="author">'+data.login+'</span>';
				if(!$('.channelListItem[data-channel='+channel+']').hasClass('currentChannel')){
					$('.channelListItem[data-channel='+channel+']').addClass('waitTabItem');
				}
			}
			if(data.login === ChannelsManager.CurrentSpeakers[channel]){
				$('.channelContainer[data-channel='+channel+'] .messageContent').last().append('<br />'+content);
			}else{
				$('.channelContainer[data-channel='+channel+']').append('<div class="message"><div class="messageInfo">'
				+authorString+
				dateString+'</div><div class="messageContent">'+content+'</div></div>');
				ChannelsManager.CurrentSpeakers[channel]=data.login;
			}
			if(data.img === true) $('.channelContainer[data-channel='+channel+'] img').last().attr('src',data.content);
			Render.Scroll();
		};
		this.SendMessage = function(){
			var message=Render.GetMessageFiledValue();
			$('#messageField').focus();
			if(message !== ''){
				Render.SetMessageFieldValue('');
				socket.emit('message',{content:message,channel:ChannelsManager.CurrentChannel,img:false});
			}
		};
		this.ReferToUser = function(){
			var name = $(this).text();
			if(name !== settings.login){
				var message = Render.GetMessageFiledValue();
				if(message){
					Render.SetMessageFieldValue(message + ' ' + name);
				} else {
					Render.SetMessageFieldValue(name + ' ');
				}
			} else return false;
		};
	};
	
	var ChannelsManager = function(){
		this.CurrentChannel = '';
		this.CurrentSpeakers = [];
		
		this.GetChannelsList = function(){
			socket.emit('getChannels');
		};
		this.JoinChannel = function(){
			var name = $(this).html();
			socket.emit('channelJoin',{login:settings.login,channel:name});
		};
		this.AddChannel = function(){
			var name = $('#addChannelField').val();
			if(name.length >= 3){
				$('#addChannelField').val('');
				socket.emit('createChannel',{channel:name});
			}else{
				// добавить предупреждение
			}
		};
		this.CreatePrivateChannel = function(data){
			console.log('create private channel fire');
			var user = PeopleManager.SelectedUser;
			if(settings.login !== user){
				var chName = [settings.login, user].sort().join('');
				if($('.channelListItem[data-channel='+chName+']').length){
					$('.channelListItem[data-channel='+chName+']').click();
				} else {
					socket.emit('createPrivateChannel',{to:user,name:chName});
					$('#privatesRow').slideDown().append('<div class="channelListItem" data-channel="'+chName+'">'+user+'<span class="channelLeave"></span></div>');
					$('#messages').append('<div class="channelContainer" data-channel="'+chName+'"></div>');
					$('.channelListItem[data-channel='+chName+']').click();
				}
			}
		};
		this.GetPrivateChannel = function(data){
			if(!$('.channelListItem[data-channel='+data.name+']').length){
				$('#privatesRow').slideDown().append('<div class="channelListItem" data-channel="'+data.name+'">'+data.from+'<span class="channelLeave"></span></div>');
				$('#messages').append('<div class="channelContainer" data-channel="'+data.name+'"></div>');
			}
		};
		this.OnChannelSwitch = function(){
			var currentChannel = ChannelsManager.CurrentChannel;
			var newChannel = $(this).attr('data-channel');			
			$('div.channelContainer[data-channel='+currentChannel+']').hide();
			$('.channelOnlineContainer[data-channel='+currentChannel+']').hide();
			$('.currentChannel').removeClass('currentChannel activeTabItem');
			$('div.channelContainer[data-channel='+newChannel+']').addClass('currentChannel').show();
			$('.channelOnlineContainer[data-channel='+newChannel+']').addClass('currentChannel').show();
			$('.channelListItem[data-channel='+newChannel+']').addClass('currentChannel activeTabItem').removeClass('waitTabItem');
			ChannelsManager.CurrentChannel = newChannel;
		};
		this.OnChannelLeave = function(){
			var channel = $(this).parent('.currentChannel').attr('data-channel');
			var channelItem = $(this).parent('.currentChannel');
			if(channelItem.next().length){
				channelItem.next().click();
			}else{
				channelItem.prev().click();
			}
			$('*[data-channel='+channel+']').remove();
			socket.emit('channelLeave',{channel:channel});
		};
		this.OnUserJoin = function(data){
			var user = data.login;
			var channel = data.channel;
			Render.RenderUser(user,channel);
			Render.Scroll();
			ChannelsManager.CurrentSpeakers[channel]='';
		};
		this.OnUserLeave = function(data){
			var channel = data.channel;
			if(channel !== ''){
				var user = data.login;
				Render.RemoveUser(user,channel);
			}
			Render.Scroll();
			ChannelsManager.CurrentSpeakers[channel]='';
		};
		this.DropImage = function(event){
			event.preventDefault();
			var allowedTypes = ["image/png", "image/jpg", "image/gif"];
			var file = event.dataTransfer.files[0];
			if(file.size > 1024*1024){
				Render.OtherNotification('Размер картинки слишком большой');
				return false;
			}
			if(allowedTypes.indexOf(file.type) < 0){
				Render.OtherNotification('Разрешены только картинки');
				return false;
			}
			var reader = new FileReader();
			var image = new Image();
			reader.readAsDataURL(file);
			reader.onload = function (event) {
				image.src = event.target.result;
				image.onload = function(){
					socket.emit('message',{content:image.src,channel:ChannelsManager.CurrentChannel,img:true});
				}
			}
		}
	};
	
	var AuthorizationManager = function(){
		this.SignIn = function(){
			if(Render.GetFieldValue('passwordField') !== ''){
				Render.FadeIn('loader');
				var password = Render.GetFieldValue('passwordField');
				SettingsManager.SaveSetting('login',Render.GetFieldValue('loginField'));
				SettingsManager.SaveSetting('autoLogin',$('#autoLogin').prop('checked'));
				socket.emit('login',{login:settings.login,password:password});
			} else if(settings.login && settings.hash && settings.autoLogin===true){
				socket.emit('login',{login:settings.login,hash:settings.hash});
			} else {
				Render.ShowSignInStatus('Заполнено не все');
			}
		};
		this.SignOut = function(){
			Render.FadeIn('overlay');
			Render.ShowLoginPanel();
			$('#channelsRow').children().remove();
			$('.channelContainer').remove();
			$('.channelOnlineContainer').remove();
			$('#messages').children().remove();
			$('#autoLogin').removeAttr('checked');
			SettingsManager.SaveSetting('hash','');
			SettingsManager.SaveSetting('autoLogin','');
			socket.emit('logOut');
			$('#loginField').val(settings.login);
			$('#autoLogin').prop('checked', settings.autoLogin);
		};
		this.OnLoginSuccess = function(data){
			$('#userBar').html(settings.login);
			Render.FadeOut('overlay');
			Render.HideLoginPanel();
			$('#serverOffline').fadeOut();
			$('#pageContainer').fadeIn();
			$('#userName').val(data.profileInfo.name);
			$('#userSurname').val(data.profileInfo.surname);
			$('#userBirthday').val(data.profileInfo.birthday);
			if(data.profileInfo.photo !== ''){
				var canvas = document.getElementById('photo')
				var ctx = canvas.getContext('2d');
				var img = document.getElementById('hidePhoto');
				img.src = data.profileInfo.photo;
				img.onload = function(){
					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img,0,0);
					var w = $('#photoArea');
					$('#photo').css('top',(w.height()-canvas.height)/2 + 'px');
					$('#photo').css('left',(w.width()-canvas.width)/2 + 'px');
				}
			}
			if(data.hash && settings.autoLogin===true) SettingsManager.SaveSetting('hash',data.hash);
			Render.RenderFriends(data.friends);
		};
		this.OnLoginFinish = function(){
			Render.FadeOut('loader');
		};
		this.OnLoginError = function(error){
			Render.ShowLoginPanel();
			Render.FadeOut('loader');
			Render.ShowSignInStatus(error);
		};
	};
	
	var PeopleManager = function(){
		this.SelectedUser = '';
		this.AddToFriends = function(){
			var user = PeopleManager.SelectedUser;
			console.log('adding ',user);
			socket.emit('addToFriends',{user:user,login:settings.login});
		};
		this.FriendAdded = function(data){
			console.log('added ',data.user);
			Render.RenderFriend(data);
		};
		this.RemoveFromFriends = function(){
			var user = PeopleManager.SelectedUser;
			console.log('removing ',user);
			socket.emit('removeFromFriends',{user:user,login:settings.login});
		};
		this.FriendRemoved = function(data){
			console.log('removed',data);
			Render.RemoveFriend(data);
		};
	}
	
	var FileTransferManager = function(){
		this.File = new Object();
		this.SendRequest = function(){
			var to = PeopleManager.SelectedUser;
			var dialogOptions = {
				type:'open',
				acceptTypes:{All:['*.*']},
				multiSelect:false,
				dirSelect:false
			}
			var onFileSelected = function(err,files){
				if(!err){
					var file = files[0];
					var stat = fs.statSync(file);
					FileTransferManager.File.Path = file;
					FileTransferManager.File.Size = stat.size;
					FileTransferManager.File.Name = path.basename(file);
					FileTransferManager.File.Type = mime.lookup(file);					
					console.log(FileTransferManager.File);
					socket.emit('sendFileRequest',{
						to:to,
						file:{
							name:FileTransferManager.File.Name,
							size:FileTransferManager.File.Size,
							type:FileTransferManager.File.Type
						}
					});
					$('#sendFile').unbind('click').addClass('notActiveMenuItem');
					Render.ShowSenderFileTransferNotification(to);
				}
			}
			window.frame.openDialog(dialogOptions,onFileSelected);
		}
		this.OnRequest = function(data){
			Render.ShowFileTransferNotification(data);
			FileTransferManager.File.From = data.from;
			FileTransferManager.File.Name = data.file.name;
			FileTransferManager.File.Size = data.file.size;
			FileTransferManager.File.Type = data.file.type;
			$('#sendFile').unbind('click').addClass('notActiveMenuItem');
			console.log(FileTransferManager.File);
		}
		this.AcceptFile = function(){
			var dialogOptions = {
				type:'save',
				acceptTypes:{All:['*.*']},
				initialValue:FileTransferManager.File.Name,
				multiSelect:false,
				dirSelect:false
			}
			var onFileSelected = function(err,file){
				if(!err){
					FileTransferManager.File.Path = file;
					console.log('file accepted', FileTransferManager.File.Path);
					Render.ShowFileTransferStatus(FileTransferManager.File.Name);
					socket.emit('fileAccepted',{from:FileTransferManager.File.From});
				}
			}				
			window.frame.openDialog(dialogOptions,onFileSelected);
		}
		this.OnFileAccepted = function(){
			Render.ShowFileTransferStatus(FileTransferManager.File.Name);
			var filePath = FileTransferManager.File.Path;
			var fileSize = fs.statSync(filePath).size;
			var fileServer = child_process.fork(__dirname+'\\content\\js\\workers\\fileServer.js',{env:{filePath:filePath},silent:true});
			fileServer.on('message',function(message){
				if(message.type === 'serverReady'){
					socket.emit('fileServerStarted');
					console.log('fileServerStarted');
				}else if(message.type === 'progressUpdate'){
					Render.UpdateFileTransferProgress(message.bytesWritten,fileSize,message.speed);
				}else if(message.type === 'workerExit'){
					Render.UpdateFileTransferProgress(message.bytesWritten,fileSize);
					console.log('transfer complete');
					socket.emit('transferComplete');
					Render.OtherNotification('Передача успешно завершена');
				}
			});
			fileServer.on('exit',function(){
				console.log('child exited'+(new Date().getTime()));
				$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
			});
			fileServer.stderr.on('data',function(data){
				console.log(data.toString());
				console.log('error in child');
				$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
				Render.OtherNotification('Ошибка передачи');
			});
			$('.cancelTransfer').one('click',function(){
				fileServer.kill();
				console.log('cancelTransfer event');
				socket.emit('transferComplete');
				$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
				Render.OtherNotification('Передача отменена');
			});
		};
		this.OnFileServerStarted = function(data){
			Render.ShowFileTransferStatus();
			var filePath = FileTransferManager.File.Path;
			var fileSize = FileTransferManager.File.Size;
			var fileSocket = child_process.fork(__dirname+'\\content\\js\\workers\\fileSocket.js',{env:{filePath:filePath,serverAddress:data.ip},silent:true});
			fileSocket.on('message',function(message){
				if(message.type === 'serverConnectionEstablished'){
					console.log('connected to sender');
				}else if(message.type === 'progressUpdate'){
					Render.UpdateFileTransferProgress(message.bytesRead,fileSize,message.speed);
				}else if(message.type === 'workerExit'){
					console.log('transfer complete');
					socket.emit('transferComplete');
					$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
					Render.OtherNotification('Передача успешно завершена');
				}else if(message.type === 'error'){
					console.log(message.err);
					$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
					Render.OtherNotification('Ошибка передачи');
				}
			});
			var cleanOnCancel = function(path) {
				Render.OtherNotification('Передача отменена');
				fs.unlink(path,function(err){
					if(!err){
						console.log('clean up done');
					}
				})
			};
			fileSocket.on('exit',function(){
				console.log('child exited'+(new Date().getTime()));
				$('#sendFile').bind('click').removeClass('notActiveMenuItem');
				if(fileSize > fs.statSync(filePath).size){
					cleanOnCancel(filePath);
				}
			});
			fileSocket.stderr.on('data',function(data){
				console.log(data.toString());
				console.log('error in child');
				$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
				Render.OtherNotification('Ошибка передачи');
			});
			$('.cancelTransfer').one('click',function(){
				if(fileSocket){
					$(this).attr('disabled','disabled');
					fileSocket.kill();
					socket.emit('transferComplete');
					$('#sendFile').bind('click',FileTransferManager.SendRequest).removeClass('notActiveMenuItem');
				}
			});
		};
		this.CancelFile = function(){
			socket.emit('fileRejected',{user:settings.login,from:FileTransferManager.File.From});
			Render.OtherNotification('Передача отменена');
		};
		this.OnFileRejected = function(data){
			Render.OtherNotification('Пользователь '+data.user+' не захотел принимать файл');
		};
	}
	
	var SettingsManager = new SettingsManager();
	var settings = SettingsManager.GetSettingsObject();
	var Render = new Render(window);
	var MessageHandler = new MessageHandler();
	var AuthorizationManager = new AuthorizationManager();
	var ChannelsManager = new ChannelsManager();
	var SocketManager = new SocketManager();
	var ProfileManager = new ProfileManager();
	var RegistrationManager = new RegistrationManager();
	var FileTransferManager = new FileTransferManager();
	var PeopleManager = new PeopleManager();
	var socket;
	
	SocketManager.ServerConnect();
		
	socket.on('loginSuccessful',AuthorizationManager.OnLoginSuccess);
	socket.on('registrationSuccessful',RegistrationManager.OnRegistrationSuccess);
	socket.on('registrationFailed',RegistrationManager.OnRegistrationFailed);
	socket.on('profileInfoUpdateSuccessful',ProfileManager.OnProfileInfoUpdateSuccessful);
	socket.on('profileInfoUpdateFailed',ProfileManager.OnProfileInfoUpdateFailed);
	socket.on('loginError',AuthorizationManager.OnLoginError);
	socket.on('message',MessageHandler.OnMessage);
	socket.on('userJoined',ChannelsManager.OnUserJoin);
	socket.on('userLeaved',ChannelsManager.OnUserLeave);
	socket.on('sendChannel',Render.RenderChannels);
	socket.on('loginProcedureFinish',AuthorizationManager.OnLoginFinish);
	socket.on('allChannels',Render.RenderChannelsList);
	socket.on('privateChannel',ChannelsManager.GetPrivateChannel);
	socket.on('friendAdded',PeopleManager.FriendAdded);
	socket.on('friendRemoved',PeopleManager.FriendRemoved);
	socket.on('connect',SocketManager.OnConnect);
	socket.on('error',SocketManager.OnError);
	socket.on('disconnect',SocketManager.OnDisconnect);
	socket.on('sendFileRequest',FileTransferManager.OnRequest);
	socket.on('fileAccepted',FileTransferManager.OnFileAccepted);
	socket.on('fileRejected',FileTransferManager.OnFileRejected);
	socket.on('fileServerStarted',FileTransferManager.OnFileServerStarted);
	
	$('body').on('contextmenu',Render.ShowContextMenu);
	$('body').on('mousedown','#textareaResizer',Render.OnMessageFieldResize.MouseDown);
	$('body').on('mouseup',Render.OnMessageFieldResize.MouseUp);
	$('body').on('mouseleave',Render.OnMessageFieldResize.MouseLeave);
	$('[data-action=open]').on('click',Render.OpenWindow);
	$('[data-action=close]').on('click',Render.CloseWindow);
	$('[data-page=channels]').on('click',ChannelsManager.GetChannelsList);
	$('#profileSave').on('click',ProfileManager.SaveProfileInfo);
	$('#settingsDivisionsList li').click(Render.SwitchSettingsPage);
	$('#sendMessage').on('click',MessageHandler.SendMessage);
	$('#avatarSelector').click(ProfileManager.OnAvatarSelect);
	$('#rotatePhotoLeft').click(function(){ProfileManager.rotatePhoto(-90);});
	$('#rotatePhotoRight').click(function(){ProfileManager.rotatePhoto(90);});
	$('#messageField').keypress(function(e){if(e.which === 13){MessageHandler.SendMessage;return false;}});
	$('#channelsList').on('dblclick','.channel',ChannelsManager.JoinChannel);
	$('#rightColumnHeader').on('click','.channelListItem',ChannelsManager.OnChannelSwitch);
	$('#rightColumnHeader').on('click','.channelLeave',ChannelsManager.OnChannelLeave);
	$('#channelTabs').on('click','a',Render.PeopleTabsSwitch);
	$('#createChannel').on('click',Render.AddChannel);
	$('#signIn').on('click',AuthorizationManager.SignIn);
	$('#registration').on('click',Render.ShowRegistration);
	$('#showLoginPanel').on('click',Render.ShowSignInForm);
	$('#regSubmit').on('click',RegistrationManager.RegistrationSubmit);
	$('#messages').on('click','.author',MessageHandler.ReferToUser);
	$('#privateChannel').on('click',ChannelsManager.CreatePrivateChannel);
	$('#addToFriends').on('click',PeopleManager.AddToFriends);
	$('#deleteFromFriends').on('click',PeopleManager.RemoveFromFriends);
	$('#logOut').on('click',AuthorizationManager.SignOut);
	$('#sendFile').on('click',FileTransferManager.SendRequest);
	$('#fileAccept').on('click',FileTransferManager.AcceptFile);
	$('#fileCancel').on('click',FileTransferManager.CancelFile);
	//$('#cancelTransfer').click(FileTransferManager.
	$(document).on('click',Render.ShowContextMenu);
	$("#messages")[0].addEventListener("drop",ChannelsManager.DropImage);
	$(document)[0].addEventListener("drop",function (e){e.preventDefault();});
	
	var date = new Date();
	var monthes = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','ноября','декабря'];
	var weekDays = ['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
	$('#calendar').html('Сегодня '+date.getDate()+' '+monthes[date.getMonth()-1]+' '+date.getFullYear()+' года.');
	
});
