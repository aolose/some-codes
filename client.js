/**
 * @description
 * 	只在default.jsp 加载
 * 	作用：
 * 		接收建立socket链接，接收socket消息
 * 		通过postMessage 分发消息
 *
 *=======功能导航 [webStorm下ctrl+鼠标右键快速跳转] ==========
 * @see  构建提示内容
 * @see  显示提示内容
 * @see  消息订阅
 * @see  消息退订
 * @see  订阅事件监听
 * @see  窗口消息监听
 * @see  Socket监听
 * @see  建立Socket连接
 * @see  频道订阅池
 * @see  频道监听事件列表
 *
 * =======使用说明=========
 * 1.主动订阅/退订 Socket消息
 * @see winMsg
 * @example iframe窗口代码:
 * 	winMsg({
 * 		module: 'msg',  // 必须
 * 		action: 'subscribe', //  订阅  ，退订使用 unsubscribe
 * 		channel: v	// groupId
 * 	})
 *
 * */
var MsgCenter=function(){
	var
		/**@member {*} 频道订阅池**/
		channelMap={},
		/**@member {*} 频道监听事件列表**/
		subscribeListener=[];

	/**
	 * @member {function} 显示提示内容
	 * */
	var desktopNotice = function(c){
		var close = definedDom('div',{class:'close',onclick:function(){
			$d.fadeOut(function(){
				$d.remove()
			})
		}});
		c.close = function(){
			close.onclick();
		};
		var d=definedDom('div',{class:'notice-prev',children:[
			c.icon&&{
				tag:'div',
				class:'icon',
				css:{backgroundImage:'url('+ c.icon+')'}
			},
			{tag:'div',class:'container',children: c.dom},
			close
		]});
		var $d=$(d);
		var $last = $('.notice-prev:last');
		if($last.length)$last.after(d);
		else $('#desktopWrapper').append(d);
		setTimeout(function(){
			$d.addClass('show');
			if(!c.disableAutoHide)
			setTimeout(function(){
				if(d.parentNode){
					close.onclick();
				}
			},3000)
		},500)
	};

	/**
	 * @member {function} 构建提示内容
	 * */
	var buildNotice=function(d,icon,keepVisable){
		var dom,type=typeof d;
		if('string'===type){
			icon=icon||iconSys;
			dom={tag:'span',text:d}
		}else if('object'===type){
			var title={
				custom:{
					title: d.title,
					icon: d.icon
				},
				order:{
					title:'订单消息',
					icon:iconMsg
				},
				friends:{
					title:'好友验证',
					icon:iconMsg
				}
			};
			var url = d.handleUrl;
			var uKey=((url+'').match(/\/(\w+)\.jsp/)||[])[1];
			var mTitle=title[d.msgModule]||{};
			var wInfo=pageUrlInfo[uKey]||{
					windowsId:'w'+parseInt(Math.random()*1000),
					windowTitle:mTitle.title||'未分类窗口',
					chatTitle:mTitle.title||'消息'
				};
			icon=icon||wInfo.msgIcon;
			keepVisable=true;
			var rollText=function(){
				var self=this;
				setTimeout(function(){
					var parent = self.parentNode;
					var wp = parent.offsetWidth;
					var ws = self.offsetWidth;
					var dis = ws-wp;
					var k={};
					self.onmouseenter=function(){k.t=1};
					self.onmouseleave=function(){k.t=0};
					if(dis>0){
						var _t = self.textContent;
						self.textContent+='　　'+_t;
						var _ws = self.offsetWidth;
						var _dis= _ws-wp;
						var d=0;
						setInterval(function(){
							if(!k.t){
								++d;
								if(d===_dis)d=dis;
								self.style.left=-d+'px';
							}
						},50);
					}
				},300);
			};
			dom={
				class:'msg-n',
				tag:'div',children:[{
					tag:'div',class:'title',text:mTitle.title,title:'点击查看详情'
				},{
					tag:'div', class:'content',children: d.dom||[
						{tag:'div',class:'msg',text: d.msgContent,func:rollText},
						{tag:'div',class:'from',text: d.fromName+'['+d.fromElsAccount+' '+ d.fromElsSubAccount+']',func:rollText}
					]
				}],
				onclick:(url&&function(){
					openMessage(d);
					this.close();
				})|| d.onclick,
				func:function(){
					this.close=function(){result.close()}
				}
			};
		}
		var result = {
			icon:icon,
			dom:dom,
			disableAutoHide:keepVisable
		};
		return result;
	};

	/**
	 * @member {function} 订阅事件监听
	 * */
	var onSubscribe = function(x){
		if(typeof x==='function')return subscribeListener.push(x);
		else subscribeListener.forEach(function(f){f(x)})
	};

	var unsubscribeMsg = function(source,channel){
		var _c = channelMap[channel];
		var index = _c&&_c.indexOf(source);
		if(_c&&-1!==index)_c.splice(index,1);
		if(_c&&!_c.length)delete  channelMap[channel];
		index=source.channels.indexOf(channel);
		source.channels.splice(index,1);
	};

	/**
	 * @member {function} 窗口消息监听
	 * */
	window.addEventListener('message', function(e){
		var origin = e.origin || e.originalEvent.origin;
		//todo 白名单
		var data = e.data;
		var winId = data.targetWindow;
		var msg = data.data;
		var module=msg.module;
		var source = e.source;
		console.log('\n[TOP]','\n来源:', origin,'\n消息:' ,msg);
		// 转发窗口消息
		if(winId){
			var win = document.getElementById('iframeApp_'+winId);
			if(win)win.contentWindow.postMessage(msg,'*');
		}else {
			var channel=msg.channel;
			if(module==='msg'&&channel){
				var action=msg.action;
				var _c = channelMap[channel];
				switch (action){
					case 'showUnReadMsgCount':
						if(!_c){
							channelMap[channel]=[];
							var count = msg.msgCount;
							if(count){
								desktopNotice(buildNotice({
									onclick:function(){
										$('#msgManage').click();
										this.close();
									},
									title:'系统提醒',
									icon:iconSys,
									msgModule:'custom',
									dom: [
										{tag:'span',text:'您有'},
										{tag:'span',text:count,css:{
											color:'red',
											fontWeight:600
										}},
										{tag:'span',text:'条未读消息'}
									]
								}));
							}
						}
						break;
					case 'sendMsg':
						if(_c){
							_c.forEach(function(w){
								if(source!==w&&w._chatState)
									w.postMessage({
										channel:channel,
										msg:msg.msg
									},'*');
							})
						}
						break;
					/**
					 * @member  {*} 消息订阅
					 * */
					case 'subscribe':
						if(!_c)channelMap[channel]=_c=[];
						if(_c.indexOf(source))_c.push(source);
						if(!source.channels)source.channels=[];
						if(source.channels.indexOf(channel)===-1){
							source.channels.push(channel)
						}
						//触发订阅监听
						onSubscribe(source);
						break;
					/**
					 * @member {function} 消息退订
					 * */
					case  'unsubscribe':
						unsubscribeMsg(source,channel);
						break;
				}
			}
		}
	},false);

	/**
	 * @member  {object} 建立Socket连接
	 * */
	var msgCount;
	var socket = io(nodejsUrl).on('connect',function(){
		//向服务端注册登录信息
		socket.emit('login',{
			elsAccount:elsAccount,
			elsSubAccount:elsSubAccount
		});
		desktopNotice(buildNotice('socket已连接'));
	});

	/**
	 * @member {function} Socket监听
	 * */
	socket.on('msg',function(obj){
				console.log('[SOCKET]',obj);
				var subscribed = false;
				var channel = obj.groupId,winLis;
				if(winLis=channelMap[channel]){
					if(winLis){
						for(var i=winLis.length-1;i>-1;i--){
							var w = winLis[i];
							// 如果有窗口订阅该消息 分发该消息到对应窗口
							if(w.parent) {
								if(w._chatState){
									w.postMessage({
										channel:channel,
										msg:obj
									},'*');
									subscribed=true;
								}
							} else {
								// 窗口不存在
								w.channels.forEach(function(c){
									unsubscribeMsg(w,c);
								})
							}
						}
					}
				}
		// 如果没有窗口订阅该消息 执行默认操作
		if(!subscribed){
			desktopNotice(buildNotice(obj))
		}
	});
	return {
		onSubscribe:onSubscribe,
		subscribeListener:subscribeListener,
		channelMap:channelMap
	};
}();

