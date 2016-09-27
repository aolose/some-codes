var app = require('express')();
var users={};//在线用户socket 集合
var bodyParser = require("body-parser");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Redis = require('ioredis');
var getUser = function(els,subEls){
	var u = users[els];
	if(u)return u[subEls]
};
var cluster = new Redis.Cluster(  
    [{  
      port: 7000,  
      host: '112.74.96.60'  
    }, {  
      port: 7001,  
      host: '112.74.96.60'  
    }, {  
      port: 7002,  
      host: '112.74.96.60'  
    }, {  
      port: 7003,  
      host: '112.74.96.60'  
    }, {  
      port: 7004,  
      host: '112.74.96.60'  
    }, {  
      port: 7005,  
      host: '112.74.96.60'  
    }, {  
      port: 8000,  
      host: '112.74.96.60'  
    }, {  
      port: 8001,  
      host: '112.74.96.60'  
    }, {  
      port: 8002,  
      host: '112.74.96.60'  
    }]  
);

app.use(bodyParser.json({limit: '1mb'}));  //这里指定参数使用 json 格式
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', function(req, res){res.send('<h1>Welcome Message Server</h1>');});
// 接收服务端消息分发到客户端
app.post('/:q',function(req,res){
	var msgList = req.body;
	if(!msgList)return;
	if(!Array.isArray(msgList))msgList=[msgList];
	msgList.forEach(function(m){
		var u=getUser(m.toElsAccount, m.toElsSubAccount);
		m._fromSocket=req.params.q;
		if(u)u.emit('msg',m)
	});
	//var els = req.headers.elsaccount;
	//var token = req.headers.accesstoken;
	//if (!els || els == '' || els == undefined || !token || token == '' || token == undefined){
	//	res.send("OK");
	//	return;
	//}
	//cluster.get(token,function(err, res){
	//	if (res === els){
	//		cluster.del(token);
	//		var
	//			obj 					= req.body;
	//		if(!Array.isArray(obj)){obj=[obj]}
	//		obj.forEach(function(o){
	//			var els = o.elsAccount;
	//			var elsSub = o.elsSubAccount;
	//			var t = users[els];
	//			if(t){
	//				var user = users[elsSub];
	//				if(user){
	//					delete o.elsAccount;
	//					delete o.elsSubAccount;
	//					user.emit('msg',o);
	//				}
	//			}
	//		});
	//	}
	//});
	res.send("OK");
});

io.on('connection', function(socket){
	//监听用户登陆
	socket.on('login', function(obj){
		if(typeof obj==='object'){
			console.log(obj);
			var els = socket.elsAccount = obj.elsAccount;
			var subEls = socket.elsSubAccount = obj.elsSubAccount;
			var temp = users[els];
			if(undefined===temp)temp=users[els]={};
			// todo @issue: 这里会无差别通知
			if(!temp[subEls])io.emit('login',obj);
			temp[subEls]=socket;
		}
	});
	//监听用户退出
	socket.on('disconnect', function(){
		var els = socket.elsAccount;
		var elsSub = socket.elsSubAccount;
		var temp = users[els];
		if(temp)delete temp[elsSub];
		if(!temp||!Object.keys(temp).length){
			cluster.lrem("key_onlineElsAccountList#",1,socket.elsAccount);
			delete users[els];
			// todo @issue: 这里会无差别通知
			io.emit('disconnect',{
				elsAccount:els,
				elsSubAccount:elsSub
			})
		}
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});