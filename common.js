if(top!==window){
    window.ChatBox=top.ChatBox;
    window.userInfoCache=top.userInfoCache;
    window.elsDeskTop = top.elsDeskTop;
    window.MsgCenter = top.MsgCenter;
}
var pageUrlInfo={
    friendsVerify:{
        windowsId:'friendsVerify',
        windowTitle:'好友验证'
    },
    purchaseOrderManage:{
        windowsId:'purchaseOrderManage',
        windowTitle:'采购订单管理',
        chatTitle:'采购订单'
    },
    saleOrderManage:{
        windowsId:'purchaseOrderManage',
        windowTitle:'销售订单管理',
        chatTitle:'销售订单'
    },
    editPurchaseOrder:{
        windowsId:'edit_PurchaseOrder',
        windowTitle:'修改订单',
        chatTitle:'采购订单'
    },
    editSaleOrder:{
        windowsId:'edit_SaleOrder',
        windowTitle:'修改订单',
        chatTitle:'采购订单'
    }
};
/**
 * 基于消息打开窗口
 * @param {object} d 消息对象 必选
 * @param {object} [defaultOpt]  可选 未匹配到对应地址配置则使用该配置
 * @param {object} [opt] 增加窗口配置  可选 参见elsDeskTop.defineWin 配置
 * */
var openMessage = function(d,defaultOpt,opt){
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
    if(typeof d!=='object')return;
    var url = d.handleUrl;
    if(!url)return;

    $.get(basePath+'/rest/MsgService/handlerMsg/'+ d.msgId).done(function(){
        console.log('已处理消息'+d.msgId);
    });

    var uKey=((url+'').match(/\/(\w+)\.jsp/)||[])[1];
    var wInfo=pageUrlInfo[uKey]||defaultOpt;
    elsDeskTop.defineWin($.extend({},{
        iconSrc:basePath+'/elsRes/images/icon/destop-icon/desktop_icon_91.gif',
        windowStatus: 'maximized',
        windowMinWidth: 960,
        windowMinHeight: 700,
        windowWidth: 960,
        windowHeight: 700,
        parentPanel: '.currDesktop',
        iframSrc:basePath+'/'+url
    },wInfo,opt));
    var win = top.document.getElementById('iframeApp_'+wInfo.windowsId).contentWindow;
    if(d.groupId){
        var ws=MsgCenter.channelMap['chatInit'];
        var postInitC=function(w){
            if(win===w)w.postMessage({
                channel:'chatInit',
                title: wInfo.chatTitle+'['+((url.match(/keyWord=(\d+)/)||[])[1]||'')+']',
                multiple:true,
                module:d.msgModule,
                businessId: d.businessIds,
                refreshData:false
            },'*');
            var index = MsgCenter.subscribeListener.indexOf(postInitC);
            if(index!==-1)MsgCenter.subscribeListener.splice(index,1);
        };
        if(Array.isArray(ws)&&ws.indexOf(win)!==-1){
            postInitC(win)
        }else MsgCenter.onSubscribe(postInitC);
    }
};

/**
 * @function onMsg
 * 发送消息到指定ID的窗口
 * 如果没有id 则发送到顶层win
 * @param {string|number|object} id  窗口ID
 * @param {object} [msg] 发送的消息
 * */
var winMsg = function(id,msg){
    if(arguments.length===1){
        msg=id;
        id=undefined;
    }
    top.postMessage({
        targetWindow:id,
        data:msg
    },elsPath+'*');
};

/**
 * @function onMsg
 * 包装onmessage 事件
 * @param {function} func
 *  接收到消息后执行 func(msg)
 *  如果func(msg)返回false 则阻止监听事件冒泡
 * */
var onMsg = function(func){
    window.addEventListener("message",function(e){
        var origin = e.origin || e.originalEvent.origin;
        if(elsPath.indexOf(origin)===-1)return;
        var msg = e.data;
        console.log('\n[IFRAME]','\n来源:', origin,'\n消息:' ,msg);
        if(func(msg)===false){
            e.stopPropagation();
            e.preventDefault();
        }
    })
};

/**
 * @description  便捷的接口数据请求  包装Ajax方法 少打字~
 * @params base {String} 服务地址  e.g "/rest/xxService"
 * @return {Function} returnFuc(API_Url,...param)
 *      @function returnFuc
 *      @description 数据获取器 自动识别get 和post （基于url最后是否有‘/’）
 *      @params API_Url {String} api地址 xxService之后的部分 e.g 'sendChat'
 *      @params param {...} 携带的数据
 *      @return {Function} func(doneCallback,failCallback)
 *      @example
 *          var fetchX = APIGet('/rest/MsgService');
 *              var API={
 *       		load:'findMyChatMsg',
 *	         	send:'sendChatMsg'
 *      	};
 *      	fetchX(API.load,{...})(done,fail)
 * */
var APIGet = function(base){
    return function(url){
        url=basePath+base+'/'+url;
        var params = [].slice.call(arguments,1);
        var isGet = /\/$/.test(url);
        if(isGet)url+=params.join('/');
        var o = {
            url:url,
            type:isGet?'GET':'POST',
            contentType: "application/json",
            dataType: "json"
        };
        if(!isGet&&params[0]){
            o.data=JSON.stringify(params[0]);
        }
        return function(done,fail){
            $.ajax(o).done(done).fail(fail)
        };
    };
};

/**

 *  @description 图片地址转BASE64
 *  @param {string} src
 *  @param {number} height
 *  @param {number} width
 *  @return {object} 返回 promise 对象
 *  @example
 *   imgSrc2DataURL('icon/destop-icon/desktop_icon_130.gif').done(function(a){console.log(a)})
 * */
var imgSrc2DataURL = function(src,width,height){
    var dfd =  $.Deferred();
    definedDom('img',{
        src:src,
        onload:function(){
            var c = definedDom('canvas',{height:height||this.height, width :width||this.width});
            c.getContext('2d').drawImage(this, 0, 0,width,height);
            dfd.resolve(c.toDataURL());
        },
        onerror:function(){
            dfd.reject(new Error('加载地址失败'),src);
        }
    });
    return dfd.promise();
};


/**
 *  @description    带筛选功能和键位操作的下拉组件
 *  @author     zwy
 *  @create     2016-5-11 14:43
 *  @example
 *   <div id = 'xxx' els-dp></div>
 *
 *  <script>
 *      var  dp = $('#xxx')[0] ;                                     //- 获取功能已经初始化好的Dom对象
 *
 *      dp.onchange = function(){console.log('change',this.value)}
 *
 *      dp.handler = function(dat){ console.log(dat.d)} // 在数据渲染前 处理数据
 *      // 要生效需要在 dp.data = xx 前 设置；
 *
 *      dp.afterRender = function(){// do something} 赋值 data 之后执行
 *
 *      var data = [{c:1,d:'hello'},{c:2,d:'world'}]
 *      // 其他数据格式:
 *      // 或者 data = {1:'hello',2:'world'} 一样会正确解析
 *      // data = ['hello','world']  会解析 为[{c:'0',d:'hello'},{c:'1',d:'world'}]
 *
 *      dp.kName ='c' ;                             // - 设定 数据的key值对应字段
 *      dp.vName = 'd' ;                            // - 设定 数据的文本值对应字段 即页面显示内容
 *      dp.data = data;                              // 赋值 自动生成下拉内容
 *       // 赋值后执行 dp.handler
 *       // 输出  hello
 *      // 输出  world
 *
 *      dp.value = '2'                                  // - 设置 c 为2 的数据选中
 *      // 触发onchange 输出 '2'
 *      dp.value = '2'                                  // - 不触发onchange
 *      console.log(dp.value)                      // - 输出 当前选中的值 2
 *      console.log(dp.selected )                // - 输出 当前选中的Dom <li>world</li>
 *      console.log(dp.selected._d )           // - 输出 当前选中的Dom 对应的数据模型
 *      console.log(dp.selectedIndex )     // - 输出 当前选中的数据下标 1
 *      dp.selectedIndex  =  0；
 *      console.log(dp.value)                      // - 输出 1
 *      dp.selectedIndex  =  99；            // 报错 不改变
 *
 *  </script>
 * */
$(function(){

    $('div[els-dp]').each(function(index,dp){
        var act = function(li){
            if(!li)return;
            if(dp._sel)dp._sel.style.removeProperty('background');
            dp._sel = li;
            dp._sel.style.background = '#dcdcdc';
            (li.scrollIntoViewIfNeeded||li.scrollIntoView).call(li);
        };
        dp.kName='k';
        dp.vName='v';
        dp.innerHTML='';
        var filterLis = function(){
            var _v = this.value.replace(/^\s+|\s+$/,'').toLowerCase();
            dp.state=1;
            ul.visLis=[];
            [].forEach.call(ul.childNodes,function(li){
                var d = li._d;
                var isInK = (d[dp.kName]||'').toLowerCase().indexOf(_v)!==-1;
                var isInV = (d[dp.vName]||'').toLowerCase().indexOf(_v)!==-1;
                var show = isInV||isInK;
                if(show)ul.visLis.push(li);
                li.style.display = show?'':'none';
            });
        };
        var showLis = function(e){
            e.preventDefault();
            e.stopPropagation();
            var _k = dp.value;
            if(_k===''&&text.value === dp.text)text.value='';
            else this.select();
            dp.state = 1;
        };
        var text = definedDom('input',{
            class:'dp-text',
            type:'text',
            onclick:showLis,
            onkeydown :function(e){
                var k = e.keyCode;
                var index = ul.visLis.indexOf(dp._sel||dp.selected);
                if(index===-1)dp._sel=ul.visLis[0];
                act(dp._sel);
                if(k===13){
                    if(dp._sel)dp._sel.click();
                }
                if(k===38){
                    act(ul.visLis[--index]);
                }else if(k===40){
                    act(ul.visLis[++index]);
                }
            },
            oninput:filterLis,
            onfocus:showLis
        });
        var ul = definedDom('ul');
        dp.appendChild(text);
        dp.appendChild(ul);

        var outClick = function(){
            dp.state=0;
        };
        Object.defineProperties(dp,{
            state:{
                get:function(){
                    return this._state;
                },
                set:function(v){
                    var self = this;
                    this._state=v;
                    if(!v){
                    // 关闭
                        [].forEach.call(ul.childNodes,function(li){li.style.maxHeight='0px'});
                        text.value = dp.text;
                        ul.style.opacity=0;
                        setTimeout(function(){
                            ul.style.display='none'
                        },300)
                    }else {
                        act(dp._sel);
                    // 打开
                        if($.__active_dp&&$.__active_dp!==self)$.__active_dp.state=0;
                         $.__active_dp = self;
                        ul.style.display='block';
                        ul.style.opacity=1;
                        ul.visLis=[].filter.call(ul.childNodes,function(li){return li.style.display!=='none'});
                        dp._sel = dp.selected||ul.visLis[0];
                        setTimeout(function(){
                            [].forEach.call(ul.childNodes,function(li){li.style.maxHeight='30px'});
                        },100);
                        $(document.body).off('click',outClick).one('click',outClick);
                    }
                }
            },
            text:{
                get:function(){
                    return text._d&&text._d[dp.vName]||'';
                }
            },
            selectedIndex:{
                get:function(){
                    return [].indexOf.call(ul.childNodes,dp.selected)
                },
                set:function(v){
                    ul.childNodes[v].click();
                }
            },
            value:{
                get:function(){
                    return text._d&&text._d[dp.kName];
                },
                set:function(k){
                    var lis = ul.childNodes;
                    for(var i=0;i<lis.length;i++){
                        var li = lis[i];
                        if(li._d[dp.kName]==k){
                            act(li);
                           return   li.click();
                        }
                    }
                }
            },
            data:{
                get:function(){
                    return this._d;
                },
                set:function(v){
                    dp.selected = undefined;
                    var _k = dp.kName;
                    var _v = dp.vName;
                    if(!v)v=[];
                    delete text._d;
                    ul.innerHTML ='';
                   var ks = Object.keys(v);
                    var data=ks.map(function(k){
                        var d=v[k];
                        var _d={};
                        if(typeof d==='object'){
                            _d= d;
                        }else {
                            _d[_k]=k;
                            _d[_v]=d;
                        }
                        if('function'===typeof dp.handler){
                            dp.handler(_d);
                        }
                        return _d;
                    });
                    // 基于显示数据排序 本地语言比较规则优先
                    data.sort(function(a,b){
                        var compare = function(c){return this>c&&1||this<c&&-1||this==c&&0};
                        return(a&&a[_k]==='')?-1: (''.localeCompare||compare).call(a&&a[_v],b&&b[_v],'zh-Hans-CN',{numeric:true});
                    });

                    ul.innerHTML='';
                    ul.appendChild(definedDom({children:data.map(function(d){
                        return {
                            tag:'li',
                            _d:d,
                            text:d[_v],
                            onmouseenter:function(){
                                act(this);
                            },
                            onclick:function(e){
                                e.preventDefault();
                                e.stopPropagation();
                                dp.selected=this;
                                var old = text._d;
                                text._d =d;
                                text.value = d[_v];
                                dp.state=0;
                                if(!old||old[_k]!==d[_k]||old[_v]!==d[-v]){
                                    if(dp.onchange)dp.onchange();
                                }
                            }
                        }
                    })}));
                    this._d=v;
                    if('function' === typeof this.afterRender){
                        this.afterRender();
                    }
                }
            }
        })
    });
});

/**
 * @function createExtend 更便捷地创建对象继承关系
 *
 * @description
 * Object 对象上添加不可枚举的 createExtend 方法 生成新的继承对象
 *e.g 1.
 *      var a={c:1};
 *      var b = a.createExtend({d:1})
 *      //b -> {c:1,d:1}
 *
 * e.g 2.
 *      var Person = function(){};
 *      var Man = Person.createExtend(
 *          function(name){this.name = name},
 *          {sex:'male'}
 *       );
 *       var m = new Man
 *
 * @param {function} [c] constructor 在原有的constructor 中插入的方法
 * @param {object} [o] 在原有的对象添加属性
 * @param {boolean} [d] true-属性深拷贝 false-属性浅拷贝  默认false
 * */
if(!Object.prototype.createExtend)Object.defineProperties(Object.prototype,{
    createExtend:{
        enumerable:false,
        value:function(c,o,d){
            var skipO =[],skipK=[];
            var copyObject = function(a,b){
                for(var k in a){
                    if(a.hasOwnProperty(k)){
                        var e = a[k];
                        if(skipO.indexOf(e)===-1){
                            if(d===obj&&skipK.indexOf(k)>-1)continue;
                            if(d&&typeof e==='object'){
                                b[k]={};
                                copyObject(e,b[k]);
                            }else{
                                b[k]=e;
                            }
                            skipO.push(e);
                            if(b===obj) skipK.push(k);
                        }
                    }
                }
            };
           var args = Array.prototype.slice.call(arguments,0,2);
            for(var i=args.length;i--;){
                var n = args[i];
                var t = typeof n;
                if(t==='object')o=n;
                else if(t==='function')c=n;
                else if(t==='boolean')d=n;
            }
            c=typeof c!=='object'&&c||o.constructor;
            var obj,that = this;
            if(typeof that === 'function'){
                obj = function(){
                    var x = that.apply(this,arguments);
                    if(typeof c==="function")c.apply(this,arguments);
                    if(x&&o){copyObject(o,x)}
                    return x;
                };
                obj.prototype = Object.create(that.prototype);
                if(o)copyObject(o,obj.prototype);
                obj.prototype.constructor=obj;
            }else if(typeof that==='object'){
                obj={};
                if(o){
                    copyObject(o,obj);
                    copyObject(that,obj)
                }
            }
            return obj;
        }
    }
});

window.jsLang  =top.jsLang;
var cssLoader = function(basePath,cssArray,s){
    document.head.appendChild(definedDom(cssArray.map(function(a){
        return {
            tag : 'link',
            rel:'stylesheet',
            href:basePath+ a.replace(/\.css\s+$/,'')+'.css'+(s&&('?'+s)||'')
        }
    })));
};
(function(DOMParser) {
    "use strict";
    var
        proto = DOMParser.prototype
        , nativeParse = proto.parseFromString;
    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser()).parseFromString("", "text/html")) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) {}

    proto.parseFromString = function(markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            var
                doc = document.implementation.createHTMLDocument("")
                ;
            if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                doc.documentElement.innerHTML = markup;
            }
            else {
                doc.body.innerHTML = markup;
            }
            return doc;
        } else {
            return nativeParse.apply(this, arguments);
        }
    };
}(DOMParser));
var
    logisticsMap =[
        {'id':'aae','name':'AAE快递'},{'id':'axd','name':'安信达快递|华企快运'},{'id':'aj','name':'安捷快递'},{'id':'aramex','name':'Aramex'},
        {'id':'anwl','name':'安能物流'},{'id':'bgn','name':'布谷鸟快递'},{'id':'bfdf','name':'百福东方|EES快递'},
        {'id':'bgpyghx','name':'包裹、平邮、挂号信|国内邮政快递|华诚物流'},{'id':'cxwl','name':'传喜物流'},
        {'id':'chengguang','name':'程光快递'},{'id':'coe','name':'COE快递|东方快递'},{'id':'ctwl','name':'长通物流'},
        {'id':'cszx','name':'城市之星物流'},{'id':'cs','name':'城市100快递'},{'id':'chuanzhi','name':'传志快递'},
        {'id':'chengji','name':'城际快递'},{'id':'ddwl','name':'大达物流'},{'id':'debang','name':'德邦物流'},
        {'id':'dhl','name':'DHL快递'},{'id':'dpex','name':'DPEX快递'},{'id':'dsf','name':'递四方速递'},{'id':'dtwl','name':'大田物流'},
        {'id':'dywl','name':'大洋物流'},{'id':'ds','name':'D速快递'},{'id':'ems','name':'EMS快递|E邮宝快递'},
        {'id':'fedex','name':'FEDEX国际快递'},{'id':'fedexcn','name':'FEDEX国内快递|联邦快递'},{'id':'fkd','name':'飞康达快递'},
        {'id':'fbwl','name':'飞邦物流'},{'id':'feibao','name':'飞豹快递'},{'id':'feihu','name':'飞狐快递'},{'id':'feiyang','name':'飞洋快递'},
        {'id':'fengda','name':'丰达快递'},{'id':'fanyu','name':'凡宇快递'},{'id':'guada','name':'冠达快递'},{'id':'guangtong','name':'广通速递'},
        {'id':'gjbg','name':'国际包裹'},{'id':'gtsd','name':'高铁速递'},{'id':'gdems','name':'广东ems快递'},{'id':'gsdwl','name':'共速达物流'},
        {'id':'guotong','name':'国通快递'},{'id':'gznd','name':'港中能达|能达快递'},{'id':'henglu','name':'恒路物流'},{'id':'huiqiang','name':'汇强快递'},
        {'id':'hxlwl','name':'华夏龙物流'},{'id':'hswl','name':'昊盛物流'},{'id':'huaqi','name':'华企快递'},{'id':'huitong','name':'汇通快递'},{'id':'jingdong','name':'京东快递'},
        {'id':'jldt','name':'嘉里大通物流'},{'id':'jywl','name':'佳怡物流'},{'id':'jiaji','name':'佳吉快运'},{'id':'jiayunmei','name':'加运美快递'},
        {'id':'jingguang','name':'京广快递'},{'id':'jinyue','name':'晋越快递'},{'id':'kuaijie','name':'快捷快递'},{'id':'klwl','name':'康力物流'},
        {'id':'kjwl','name':'科捷物流'},{'id':'krwl','name':'宽容物流'},{'id':'lanhu','name':'蓝狐快递'},{'id':'longbang','name':'龙邦快递'},
        {'id':'lianhaotong','name':'联昊通快递'},{'id':'lejiedi','name':'乐捷递快递'},{'id':'lijisong','name':'立即送'},{'id':'minbang','name':'民邦快递'},
        {'id':'minhang','name':'民航快递'},{'id':'meiguo','name':'美国快递'},{'id':'meilong','name':'美龙快递'},{'id':'newl','name':'尼尔物流'},
        {'id':'ocs','name':'OCS快递'},{'id':'pinganda','name':'平安达快递'},{'id':'quanfeng','name':'全峰快递'},{'id':'quanyi','name':'全一快递'},
        {'id':'quanchen','name':'全晨快递'},{'id':'quanritong','name':'全日通快递'},{'id':'rufengda','name':'如风达快递'},{'id':'rrs','name':'日日顺物流'},
        {'id':'shiyun','name':'世运快递'},{'id':'stwl','name':'速通物流'},{'id':'shentong','name':'申通快递|申通E物流'},{'id':'shunfeng','name':'顺丰快递'},
        {'id':'suer','name':'速尔快递'},{'id':'haihong','name':'山东海红快递'},{'id':'santai','name':'三态速递'},{'id':'shenghui','name':'盛辉物流'},
        {'id':'shengfeng','name':'盛丰物流'},{'id':'shengan','name':'圣安物流'},{'id':'saiaodi','name':'赛澳递'},{'id':'tnt','name':'TNT快递'},
        {'id':'thtx','name':'通和天下物流'},{'id':'tcwl','name':'通成物流'},{'id':'tdhy','name':'天地华宇|华宇物流'},{'id':'tiantian','name':'天天快递|海航天天快递'},
        {'id':'ups','name':'UPS国际快递'},{'id':'weibang','name':'伟邦快递'},{'id':'weitepai','name':'微特派快递'},{'id':'wxwl','name':'万象物流'},
        {'id':'wanbo','name':'万博快递'},{'id':'xlyt','name':'祥龙运通'},{'id':'xindan','name':'新蛋物流|奥硕物流'},{'id':'xfwl','name':'信丰物流'},
        {'id':'xinbang','name':'新邦物流'},{'id':'yuantong','name':'圆通快递'},{'id':'yunda','name':'韵达快递'},{'id':'yibang','name':'一邦快递'},
        {'id':'yuntong','name':'运通快递'},{'id':'yzjc','name':'元智捷诚快递'},{'id':'yuanfeihang','name':'原飞航快递'},{'id':'yafeng','name':'亚风快递'},
        {'id':'ycwl','name':'远成物流'},{'id':'yuefeng','name':'越丰快递'},{'id':'yousu','name':'优速快递|UC优速快递'},{'id':'yitongda','name':'易通达'},
        {'id':'yad','name':'源安达快递'},{'id':'yxwl','name':'宇鑫物流'},{'id':'zengyi','name':'增益快递'},{'id':'zhongtong','name':'中通快递'},
        {'id':'zjs','name':'宅急送快递'},{'id':'zhongtie','name':'中铁快运'},{'id':'zhongyou','name':'中邮物流'},{'id':'zmkm','name':'芝麻开门'},
        {'id':'zzjh','name':'郑州建华快递'},{'id':'ztwy','name':'中天万运快递'}
    ],
    fullScreenEls =$(),
    isSupportImage = function (filePath) {
        return ('undefined' != typeof(filePath) && '' != filePath) &&
            ('bmp,png,gif,jpg,jpeg'.indexOf(
                filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase()) >= 0)
    },
    isSupportFile = function (filePath) {
        return ('undefined' != typeof(filePath) && '' != filePath) &&
            ('doc,docx,xls,xlsx,ppt,pptx,txt,sql,pdf'.indexOf(
                filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase()) >= 0)
    },
    /**
     * @method filterDOMString(t,f,type)
     * @param {string} t 要解析的字符串
     * @param {object} f 正则表达式数组 用于过滤
     * @param {boolean} [type] true 返回NodeLis 对象,false 返回字符串
     * @description html字符串解析过滤
     * @return {NodeList | string}
     *
     * 利用 DOMParser 正确的过滤属性
     *
     * */
    filterDOMString = function(t,f,type){
        t=t||'';
        if(!window.DOMParser)return;
        var parser=new DOMParser();
        var d = parser.parseFromString(t,'text/html').body;
        if(typeof f==='string')f=[f];
        if(Array.isArray(f)){
            $(d).find('*').toArray().forEach(function(o){
                var a = Array.apply(null,o.attributes);
                f.forEach(function(t){
                    for(var i=0;i< a.length;i++){
                        if(t.test(a[i].name)){
                            o.removeAttribute(a[i].name);
                            a.splice(i--,1);
                        }
                    }
                })
            })
        }
        if(type)return d.childNodes;
        return d.innerHTML;
    },

    /**
     * createInputFilter 带数据源的下拉过滤选择
     * @param _s 选择器名称 初始化的对象 tag必须是 input
     * @param _d 【可选】数据源 数组对象或者可以解析为数组对象的JSON字符串
     * @param h 【可选】选择器名称 监听该选择器对象的滚动或者鼠标点击事件 触发隐藏
     * @return object jquery对象
     *
     * e.g:
     * var a = createInputFilter('[name="saleOrderNumber"]',logisticsMap)
     * //也可以后面再设置数据 a.setSource( your source)
     */
     createInputFilter = function(_s,_d,h){
        var $t = $(_s),list=definedDom('ul',{
            class:'js-input-filter'
        }),
            init = function(){
                $t.click(showList);
                $t.click(showList);
                $t.on('input propertychange',filter);
                $t.setSource = setSource.bind($t);
                $t.setSource(_d);
                fixPosition();
            },
            showList = function(e){
                e.preventDefault();
                e.stopImmediatePropagation();
                var ofs = $t.offset();
                list.style.top=ofs.top+$t.outerHeight();
                list.style.left=ofs.left;
                list.innerHTML='';
                list.appendChild(definedDom({children: $t.source.map(function(c){
                    return {
                        tag:'li',
                        css:{
                            display:'none'
                        },
                        text: c.name+'('+c.id+')',
                        c_name: c.name,
                        c_id: c.id,
                        onclick : function(e){
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            $t.val(this.c_name+'('+this.c_id+')');
                            hideList();
                        }
                    }
                })}));
                document.body.appendChild(list);
                filter();
                $(list).slideDown(100);
                if(h)$(h).on('scroll  click',hideList);
                $('body').one('scroll  click',hideList);
                $(window).one('scroll  click',hideList);
            },
            hideList = function(){
               setTimeout(function(){
                   if(h)$(h).off('scroll mouseleave click',hideList);
                   $('body').off('scroll mouseleave click',hideList);
                   $(window).off('scroll mouseleave click',hideList);
                   $(list).slideUp(100,function(){
                       list.remove();
                   });
               },5);
            },
            fixPosition = function(){
                var ofs = $t.offset();
                $(list).offset({
                    top : ofs.top+$t.outerHeight(),
                    left:ofs.left
                })
            },
            filter = function(){
                var s =$t.val().replace(/^\s+|\s+/gi,'').toLowerCase();
                $(list).children().each(function(i,l){
                    var $l = $(l);
                    if(s&&$l.text().toLowerCase().indexOf(s)===-1){
                        $l.hide();
                    }else $l.show();
                })
            },
            setSource = function(s){
                if(typeof s ==='string'){
                    try {
                        s = JSON.parse(s);
                    }catch (e){
                        s=[];
                        console.error(e);
                    }
                }
                this.source  =s||[];
            };
        init();
        return $t;
    },
    fullScreenWin = function () {
        document.__fullScreenState = !document.__fullScreenState;
        localStorage.setItem('__fullScreenState', document.__fullScreenState);
        fullScreenEls.trigger('fullScreen');
    },
    makeFullScreen = function (evt) {
        var divObj = evt.target;  //  get the target element
        divObj.objFs = divObj.objFs
            || divObj['requestFullscreen']
            || divObj['msRequestFullscreen']
            || divObj['mozRequestFullScreen']
            || divObj['webkitRequestFullscreen']
            || function () {
                elsDeskTop.fullscreenIE();
            };
        if (document.__fullScreenState)
            divObj.objFs();
        else
            document.cancelDomFs();
    },
    /**
     *  autoSetTitle
     *  自动设置title
     *  @param s1 选择器1 要添加title的对象
     *  @param s2 可选 选择器2 s1的子节点 以该节点内的文字作为title 没有则取s1
     *
     * */
    autoSetTitle = function (s1, s2) {
        $(s1).each(function (i, a) {
            var $a = $(a);
            var $b = s2 && $a.find(s2) || $a;
            a.title = $b.text().replace(/[:： ]+$/, '');
        });
    },
    /**
    *  elsFieldsCheck
    *  对表单内容验证的通用行为封装
    *
    *  使用Promise风格 避免过多回调嵌套
    *  关于Promise 的入门理解请参考：http://www.ruanyifeng.com/blog/2011/08/a_detailed_explanation_of_jquery_deferred_object.html
    *  项目实际应用：WebContent\login\js\fpwd.js
    *
    *
    * e.g
    * var rNewPwd = $(...);
    *
    * //[0-名称,1-非空检查，2-正则检查,3-正则检查提示,4-上下文逻辑检查,5-逻辑检查提示,6-ajax请求检查,7-ajax错误提示]
    * rNewPwd.checkList    = [jsLang.i18n_fpw_confirm_new_password||'确认新密码', 1, 0, 0,
    *      function (v) {
    *			return v === newPwd.val();
    *		}, jsLang.i18n_js_pwd2_not_match||'两次密码不一致'
    *    ];
    *
    * elsFieldsCheck(rNewPwd,$field2,$field3...).done(function(){
    *  console.log(arguments)// arguments - 返回每个字段的Deferred结果  {$el:$f,state:'',data}，{$el:$f,state:'ajax',data}
    *  //检查通过
    *   ....
    * }).fail(function(){
    *  // 检查未通过
    *  ....
    * })
    *
    *
    * */
    elsFieldsCheck = function () {
        var checkField = function ($f, k) {
                var dfd = $.Deferred();
                setTimeout(function () {
                    if (!k || !k.v) {
                        return dfd.reject();
                    }
                    var c = $f.checkList;
                    if (c && c.length) {
                        var v = $f.val();
                        if (c[1]) {
                            // 非空检查
                            if (!v) {
                                if (k && k.v) {
                                    if (k.v)show_err_msg(c[0] + ' ' + (jsLang['i18n_js_can_not_be_empty'] || '不能为空'));
                                    k.v = false;
                                }
                            }
                        }
                        if (k.v && c[2] && c[2].test) {
                            // 正则表达式检查
                            if (!c[2].test(v)) {
                                if (k.v && c[3])show_err_msg(c[0] + c[3]);
                                k.v = false;
                            }
                        }
                        if (k.v && c[4]) {
                            if (!c[4](v)) {
                                if (k.v && c[5])show_err_msg(c[5]);
                                k.v = false;
                            }
                        }
                        if (k.v && c[6]) {
                            // ajax 检查
                            return c[6](v).done(function (data) {
                                dfd.resolve({$el: $f, state: 'ajax', data: data})
                            }).fail(
                                function (data) {
                                    if (k.v && c[7]) {
                                        if (typeof c[7] === 'string')show_err_msg(c[7]);
                                        else if (typeof c[7] === 'function') {
                                            show_err_msg(c[7].call({data: data}));
                                        }
                                    }
                                    k.v = false;
                                    dfd.reject({$el: $f, state: 'ajax', data: data});
                                }
                            )
                        } else {
                            dfd[k.v ? 'resolve' : 'reject']({$el: $f})
                        }
                    } else  dfd.resolve()
                }, 1);
                return dfd.promise();
            },
            fieldsCheck = function (args) {
                var k = {v: true};
                return $.when.apply(this, [].map.call(args, function (a) {
                    return checkField(a, k);
                }))
            };
        return fieldsCheck(arguments);
    },
    elsDeskTop = elsDeskTop || {};
   /**
    *  elsDeskTop.cookie
    *  对cookie 进行存储删除和设置生命周期的操作
    *
    *   elsDeskTop.cookie.map                          - object      cookie 转换为对象
    *   elsDeskTop.cookie.getItem(k)             - function   获取cookie中 k 的值 返回k对应的值
    *   elsDeskTop.cookie.removeItem(k,p)      - function   移除 路径为p 键为k 的cookie  返回 elsDeskTop.cookie
    *   elsDeskTop.cookie.setItem(k,v,t,p)       - function   设置cookie中的k键的值为v 周期为t秒  路径为p 返回elsDeskTop.cookie
   *
   * */
    elsDeskTop.cookie = {
        map : (function(){
            var _c = {};
            document.cookie.split(/;\s*/).forEach(function(a){
                var _a = a.match(/(.+?)=(.+)/);
                if(_a&&_a.length===3&&_a[1]!=='max-age'){
                    _c[_a[1]] = _a[2];
                }
            });
            return _c;
        })(),
        getItem : function(k){
            return this.map[k];
        },
        removeItem : function(k,p){
            p=p||'*';
            delete this.map[k];
            document.cookie = k+'=;max-age=0;path='+p;
            return this;
        },
        setItem : function (k,v,t,p){
            if(!t)t=60*60*24*7;// 默认7天
            this.map[k] = v;
            var  _c =k+'=' + v +';max-age='+t;
            if(p)_c+=';path='+p;
            document.cookie = _c;
            return this;
        }
    };

var
    Base64 = {
    _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', encode: function (e) {
        var t = '';
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    }, decode: function (e) {
        var t = '';
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9\+\/=]/g, '');
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r)
            }
            if (a != 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = Base64._utf8_decode(t);
        return t
    }, _utf8_encode: function (e) {
        e = e.replace(/\r\n/g, '\n');
        var t = '';
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    }, _utf8_decode: function (e) {
        var t = '';
        var n = 0,c2,c3;
        var r  = c2 = c3=0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
};
var
    /**
     * Dom工厂
     *
     * @param tag 标签名称 可选 类型 string
     * @param opt 配置 必选 类型 object / function
     * @return Node
     *
     *  definedDom 方法的属性是对dom对象属性直接赋值
     *  1.如果属性非标准属性属性不会生效
     *  2.如果该dom没有该属性，属性赋值成功但不会在文档结构中显示（即$.fn.attr拿不到）
     *  3.通过definedDom构建的对象属性正确获取姿势：
     *     var a= definedDom('li',{name='xx'}) // 生成 <li></li>   注： li 是没有name这个属性的 ,dom对象里只有部分对象有name
     *     a.name === 'xx' // true 正确姿势
     *     a.getAttribute('name') ==='xx'||$(a).attr('name')==='xx'   //false 错误姿势 , 除非原生dom有这个属性 比如id之类的
     *  4.使用了textContent属性 所以不支持ie8 及其以下，文本直接 text:'xxxx'
     *  5. 可以通过ajax回调生成对象，即当传入参数为function类型时候 必须要有[返回值]!!! 不然回调的参数无法添加到生成对象当中
     *  //e.g:
     *  var a = definedDom(function(cb){
     *      $.ajax(url:'xxxx').done(function(data){
     *          cb(data.map(function(d){
     *              //....your code
     *              // d需要转化为 definedDom支持参数，比如 {tag:'',name:'',css:'',children:[]...}
     *          }))
     *          //cb 会执行 definedDom，
      *        //生成的对象会 通过回调 下面返回的对象  然后appendChild
     *      });
     *      return {
     *          tag:'div'       // 要有return
     *      }
     *  })
     *  6. 使用举例
     * //e.g:
     *  var a= definedDom('a',{
     *      children:[{tag:'div'}]
     *      css:{'z-index':100}
     *  })
     *  or:
     *   var a= definedDom({
     *      tag:'a',
     *      children:[{tag:'div'}]
     *      css:{'z-index':100}
     *  })
     *
     *  //return:  <a style="z-index:100"><div></div></a>
     *
     */
    definedDom = function(tag,opt){
        var d,r ={},_func,_children;
        if('function' === typeof arguments[0]){
            var _f = arguments[0];
            var callback = function(a){
                r.dom.appendChild(definedDom(a));
            }.bind(r);
            r.dom=definedDom(_f(callback));
            return r.dom;
        }
        if('object'===typeof arguments[0]){
            opt = arguments[0];
            tag = opt['tag'];
            if(opt&&/^\[object NodeList]$|^\[object Array]$/i.test(Object.prototype.toString.apply(opt))){
                opt={children:opt}
            }
        }else {
            tag = arguments[0];
            opt=arguments[1];
        }
        var _opt={};
        for(var p in opt){
            if(opt.hasOwnProperty(p))
            _opt[p]=opt[p];
        }
        opt = _opt;
        delete opt['tag'];
        if(!tag)d=document.createDocumentFragment();
        else{
            d=document.createElement(tag);
        }
        r.dom = d;
        if(opt.virtualParentNode){
            d.virtualParentNode = opt.virtualParentNode;
            delete opt.virtualParentNode;
        }
        if(opt.text){
            d.textContent = opt.text;
            delete  opt.text
        }
        if(opt.func){
           _func = opt.func;
            delete opt.func;
        }
        if(opt.html){
            d.innerHTML = opt.html;
            delete opt.html;
        }
        if(opt.class){
            d.className = opt.class;
            delete  opt.class
        }
        if(opt.html){
            d.innerHTML = opt.html;
            delete  opt.html
        }
        if(opt.css && 'object' === typeof opt.css){
            for(var i in opt.css){
                if(opt.css.hasOwnProperty(i)){
                    d.style[i]=opt.css[i];
                }
            }
            delete opt.css;
        }
        if(opt.children){
            if(!/^\[object NodeList]$|^\[object Array]$/i.test(Object.prototype.toString.apply(opt.children))){
                _children=[opt.children];
            }else{
                _children = opt.children
            }
            delete  opt.children;
        }
        for(var o in opt){
            if(opt.hasOwnProperty(o)){
                d[o]=opt[o]
            }
        }
        if(_children){
            if(_children.length){
                var f = document.createDocumentFragment();
                [].forEach.call(_children,function(c){
                    c=c||{};
                    if(!/\[object HTML.*?Element]|\[object Text]/i.test(Object.prototype.toString.apply(c))){
                        c.virtualParentNode = d;
                        c=definedDom(c);
                    }
                    f.appendChild(c);
                });
                d.appendChild(f);
                [].forEach.call(d.children||[],function(c){
                    delete c.virtualParentNode;
                });
            }
        }
        if(_func){
            _func.call(r.dom);
        }
        return d
    },
    /**
     * 获取多语言getI18nAlertMsg
     *
     * @param key i18n 配置的key
     *
     */
    getI18nAlertMsg = function (key) {
        var msg = '';
        $.ajax({
            url: 'rest/I18nService/getResourceByKey/' + key,
            type: 'GET',
            async: false,
            contentType: 'application/json',
            data: '',
            dataType: 'json',
            success: function (data) {
                msg = data.value;
            },
            error: function () {
                alert('系统异常，请检查' + key + '的I18N配置',3);
            }
        });
        return msg;
    },
    GetQueryString = function (name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return (r[2]);
        return r;
    },
    timeStamp2String = function (time, language) {
        var datetime = new Date();
        datetime.setTime(time);
        var year = datetime.getFullYear();
        var month = datetime.getMonth() + 1 < 10 ? '0' + (datetime.getMonth() + 1) : datetime.getMonth() + 1;
        var date = datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate();
        var hour = datetime.getHours() < 10 ? '0' + datetime.getHours() : datetime.getHours();
        var minute = datetime.getMinutes() < 10 ? '0' + datetime.getMinutes() : datetime.getMinutes();
        var second = datetime.getSeconds() < 10 ? '0' + datetime.getSeconds() : datetime.getSeconds();
        var dt = year + '/' + month + '/' + date + ' ' + hour + ':' + minute + ':' + second;
        if (language != 'cn') {
            dt = month + '/' + date + '/' + year + ' ' + hour + ':' + minute + ':' + second;
        }
        return dt;
    },
    showMsg = function (msg) {
        var isIE = !-[1,];
        if (isIE)
            alert(msg);
        else
            $.MsgBox.Alert(jsLang['i18n_js_msg']||'消息', msg);
    },
    setOpacity = function (obj, val) {
        if (document.documentElement.filters) { //IE
            obj.style.filter = 'alpha(opacity=' + val + ')';
        } else {
            obj.style.opacity = val / 100;
        }
    },
    fadeIn = function fadeIn(obj) {
        var thisObj = obj;
        var val = 10;
        var t = setInterval(function () {
            if (val >= 100) {
                clearInterval(t);
            }
            setOpacity(thisObj, val);
            val += 10;
        }, 300);
    },
// 淡出
    fadeOut = function fadeOut(obj) {
        var thisObj = obj;
        var val = 90;
        var t = setInterval(function () {
            if (val <= 0) {
                clearInterval(t);
            }
            setOpacity(thisObj, val);
            val -= 10;
        }, 300);
    },
    fadein = function fadein(ele, opacity, speed) {
        if (ele) {
            var v = ele.style.filter.replace('alpha(opacity=', '').replace(')', '')
                || ele.style.opacity;
            v < 1 && (v = v * 100);
            var count = speed / 1000;
            var avg = count < 2 ? (opacity / count) : (opacity / count - 1);
            var timer = null;
            timer = setInterval(function () {
                if (v < opacity) {
                    v += avg;
                    setOpacity(ele, v);
                } else {
                    clearInterval(timer);
                }
            }, 500);
        }
    },
    fadeout = function (ele, opacity, speed) {
        if (ele) {
            var v = ele.style.filter.replace('alpha(opacity=', '').replace(')', '')
                || ele.style.opacity || 100;
            v < 1 && (v = v * 100);
            var count = speed / 1000;
            var avg = (100 - opacity) / count;
            var timer = null;
            timer = setInterval(function () {
                if (v - avg > opacity) {
                    v -= avg;
                    setOpacity(ele, v);
                } else {
                    clearInterval(timer);
                }
            }, 500);
        }
    },
    /**
     * 剪切文字
     *
     * @param  str - 要剪切的对象
     * @param len - 文字的长度 中文字符算两个长度
     * @return  String 新的字符串
     */
    textClip = function (str, len) {
        str=(str||'').replace(/^\s+|\r+|\n+|\s+$/g,'');
        for (var i = 0; i < len; i++) {
            len -= /[^\x00-\xff]/.test(str[i])
        }
        return str.slice(0, len) + (str.length>len?'...':'')
    },
    /**
     * 传入Iframe窗口数据
     *
     * @param  ifr - iframe Dom对象
     * @param a - 传入的数据
     */
    setIframeData = function (ifr, a) {
        ifr.parentData = a;
        ifr.onparentdataload = ifr.onparentdataload || $.noop;
        ifr.onparentdataload(a);
    },
    /**
     * Iframe页面内获取传入窗口的数据
     * @return 获取到的数据
     */
    getIframeData = function () {
        return (window.frameElement || {}).parentData;
    },
    /**
     *  Iframe页面内监听传入数据
     *
     * @param  func - 数据改变后的回调
     */
    onIframeDataChange = function (func) {
        var f = window.frameElement;
        if (f) {
            /**
             * @param d - 传入iframe的数据
             */
            f.onparentdataload = function (d) {
                func.call(this, d);
            }
        }
    };
/**
 * optionDragBar 侧边栏拖拽
 * init    : 初始化
 * destroy    : 移除
 *
 */
optionDragBar = (function () {
    var
        $win, // 当前窗口
        $body, // 文档body
        $mouseMoveMask, // 鼠标监听遮罩层
        $optionBar, // 右侧收起按钮
        $leftContent, // 左侧窗口
        $rightContent, // 右侧窗口
        lDefaultWidth, // 左侧默认宽度
        rDefaultWidth, // 右侧默认宽度
        dragOriginX = 'N', // 拖动起点
        dragOffsetX = 0, // 拖动横向偏移量
        dragResizeWin = function () {
            $rightContent.width(rDefaultWidth + dragOffsetX + 'px');
            $leftContent.width(lDefaultWidth - dragOffsetX - 4 + 'px');
        },
        onDragMouseMove = function (e) {
            if ('N' === dragOriginX) {
                dragOriginX = e.clientX;
            } else {
                // 边界判断
                var _dragOffsetX = dragOriginX - e.clientX;
                var rw = $rightContent.width();
                if (_dragOffsetX < 720 - rw && _dragOffsetX > 100 - rw) {
                    dragOffsetX = _dragOffsetX;
                    dragResizeWin();
                }
            }
        },
    //鼠标弹起事件
        onDragMouseStop = function () {
            mouseMoveMaskStopListen();
        },
    //鼠标拖动区域判断是否Click
        mouseMoveMaskEventCheck = function () {
            $optionBar.one('mousemove', mouseMoveMaskStartListen);
        },
    //鼠标拖动区域添加监听
        mouseMoveMaskStartListen = function () {
            if (!$optionBar.hasClass('next') || $optionBar[0].toggleState !== 1) {
                lDefaultWidth = lDefaultWidth || $leftContent.width();
                rDefaultWidth = rDefaultWidth || $rightContent.width();
                $mouseMoveMask.on('mousemove', onDragMouseMove);
                $mouseMoveMask.on('mouseup mouseleave', onDragMouseStop);
                $mouseMoveMask.css('z-index', 9999);
            }
        },
    //鼠标拖动区域移除监听
        mouseMoveMaskStopListen = function () {
            $optionBar.off('mousemove', mouseMoveMaskStartListen);
            $mouseMoveMask.off('mousemove', onDragMouseMove);
            $mouseMoveMask.off('mouseup mouseleave', onDragMouseStop);
            $mouseMoveMask.css('z-index', -9999);
        },
        removeAllListen = function () {
            if ($optionBar) {
                $optionBar.off('mousedown', mouseMoveMaskEventCheck);
                $optionBar.off('mousedup', mouseMoveMaskStopListen);
                reInit();
            }
        },
        reInit = function () {
            if ($rightContent) {
                lDefaultWidth = 0;
                rDefaultWidth = 0;
                dragOffsetX = 0;
                dragOriginX = 'N';
                $rightContent.css('width', '');
                $leftContent.css('width', '');
                mouseMoveMaskStopListen();
            }
        },
        initOptionBarDrag = function () {
            $win = $(window);
            $body = $('body');
            $body.find('.mouse-move-mask horizontal').remove();
            $body.append('<div class="mouse-move-mask horizontal"></div>');
            $mouseMoveMask = $('.mouse-move-mask');
            $optionBar = $('.saying-dialog .pre-active');
            $leftContent = $('.pos-relative.public-wrap');
            $rightContent = $('.pos-relative.right-content');
            removeAllListen();
            if ($optionBar.length && $leftContent.length && $rightContent.length) {
                $optionBar.click(reInit);
                //拖动改变列表和发送窗口高度
                $optionBar.on('mousedown', mouseMoveMaskEventCheck);
                $optionBar.on('mousedup', mouseMoveMaskStopListen);
            }
            $win.resize(reInit);
        };
    return {
        disable: removeAllListen,
        active: initOptionBarDrag
    }
}());

Date.prototype.format = function (fmt) { //author: meizz
    var o = {
        'M+': this.getMonth() + 1, //月份
        'd+': this.getDate(), //日
        'h+': this.getHours(), //小时
        'm+': this.getMinutes(), //分
        's+': this.getSeconds(), //秒
        'q+': Math.floor((this.getMonth() + 3) / 3), //季度
        'S': this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (var k in o){
        if(o.hasOwnProperty(k)&&new RegExp('(' + k + ')').test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
    return fmt;
};
if (window.$) {
    $(function () {
        window.jsLang  =top.jsLang;
        document.cancelDomFs = document['cancelFullScreen']
            || document['msExitFullscreen']
            || document['mozCancelFullScreen']
            || document['webkitCancelFullScreen']
            || function () {
                elsDeskTop.fullscreenIE();
            };
        if(window===top){
            fullScreenEls = $('.fullScreen');
            fullScreenEls.on('fullScreen',makeFullScreen);
        }
        try {
            if(!window.jsLang)jsLang = JSON.parse(localStorage.getItem('bLang'));
        }catch (e){
            console.log(e)
        }
        if(!window.jsLang)window.jsLang={};
        autoSetTitle('.common-box-line .input-and-tip','span');
        autoSetTitle('.personal-box .p-label');

        //if ($.fn.niceScroll) {
        //    var $pw =$('.public-wrap');
        //    $pw.data('nscroll', $pw.niceScroll({
        //        cursorcolor: '#d2d2d2',
        //        cursorwidth: '4px'
        //    }));
        //}
        var $oBar = $('.saying-dialog .option-bar').attr('title',jsLang['i18n_js_open']||'展开');
        var $obar2 = $('<div class="dis-block pos-absolute option-bar2 pre-active next"></div>').attr('title',jsLang['i18n_js_fully_expanded']||'完全展开');
        var obarOnClick = function (e) {
            e.stopPropagation();
            var $t = $(this),
                $s = $('.saying-dialog .right-content'),
                $p = $('.public-wrap');
            if (undefined === this.toggleState) {
                if ($s.hasClass('none-active'))this.toggleState = 1;
                else this.toggleState = 0;
            }
            switch (this.toggleState) {
                case 1:
                    $p.addClass('active').removeClass('max');
                    $s.removeClass('none-active max');
                    $t.addClass('next').attr('title',jsLang['i18n_js_ext_win']||'扩展窗口');
                    $obar2.removeClass('next').attr('title',jsLang['i18n_js_min_win']||'最小化窗口');
                    break;
                case 2:
                    $p.addClass('max active');
                    $s.addClass('max').removeClass('none-active');
                    $t.removeClass('next').attr('title',jsLang['i18n_js_shrink_win']||'收缩窗口');
                    $obar2.removeClass('next').attr('title',jsLang['i18n_js_min_win']||'最小化窗口');
                    break;
                case 3:
                    $p.addClass('active').removeClass('max');
                    $s.removeClass('max none-active');
                    $t.removeClass('next').attr('title',jsLang['i18n_js_shrink_win']||'收缩窗口');
                    $obar2.removeClass('next').attr('title',jsLang['i18n_js_min_win']||'最小化窗口');
                    break;
                case 0:
                    $p.removeClass('active max');
                    $s.addClass('none-active').removeClass('max');
                    $t.addClass('next').attr('title',jsLang['i18n_js_expand_win']||'展开窗口');
                    $obar2.addClass('next').attr('title',jsLang['i18n_js_maxsize_win']||'最大化窗口');
                    break;
            }
            this.toggleState = (this.toggleState + 1) % 4;
            var nsc = $p.data('nscroll');
            if (nsc)nsc.resize();
        };

        $oBar.before($obar2);
        $oBar.click(obarOnClick.bind($oBar[0]));
        $obar2.click(function (e) {
            e.stopPropagation();
            var toggleState = $oBar[0].toggleState;
            if (toggleState !== 1) {
                $oBar[0].toggleState = 0;
                obarOnClick.call($oBar[0], e);
            } else {
                $oBar[0].toggleState = 2;
                obarOnClick.call($oBar[0], e);
            }
        });
        //全局侧边栏拖动事件初始化
        var ifr = $('iframe'),
            initChatBar = function (e) {
                if (/(pMultiChat\.jsp|multiChat\.jsp|multiChatTest\.jsp)\??/.test(e.target.src)) {
                    optionDragBar.active();
                }
            };
        ifr.load(initChatBar);
        //Monkey Patch for mmGrid init bug when element is hidden
        var mmGridCallBacks ={};
        if ($.fn.tabs) {
            var _tabs = $.fn.tabs;
            $.fn.tabs = function () {
                var opts = arguments[0] || {};
                var _activate = opts.activate || $.noop;
                opts.activate  = function (e, ui) {
                    var tid = ui.newPanel[0].id;
                    if(mmGridCallBacks[tid])mmGridCallBacks[tid]();
                    return _activate.call(this, e, ui);
                };
                return _tabs.call(this, opts);
            };
            $.extend($.fn.tabs, _tabs);
        }
        if ($.fn.mmGrid) {
            var _mGrid = $.fn.mmGrid;
            $.fn.mmGrid = function () {
                var patchGrid = _mGrid.apply(this, arguments);
                var panel = $(this).parents('.ui-tabs-panel');
                var tabTargetId =panel.attr('id');
                var bbd = patchGrid.$mmGrid.find('a.mmg-btnBackboardDn');
                if(panel.is(':visible'))bbd[0].isFixed =true;
                if(tabTargetId)mmGridCallBacks[tabTargetId]= function () {
                        if(bbd[0].isFixed)return;
                        bbd .css({'top': patchGrid.$headWrapper.outerHeight(true)}).slideUp('fast');
                        patchGrid.resize();
                        bbd[0].isFixed =true;
                        patchGrid.width(patchGrid.$head.width());
                    };
                return patchGrid;
            };
            $.extend($.fn.mmGrid, _mGrid);
        }
    });
}
/**
 *自动匹配搜索插件 by fzb
 *使用 $('class').elsAutoLoad(option||'') 
 *需要依赖jq和jq插件niceScroll
 */
(function ($) {
	$.fn.elsAutoLoad = function(options) { 
		var dft = {
				type:'n',
			getDateUrl:'rest/ElsSearchDictionaryService/getFields',
			elsAccount:elsAccount||'',
			tableName:'supplier_main_data',
			fieldName: 'bankCode',
			antoClass:"auto-wrap"
		};
		var ops = $.extend(dft,options);
		$('.'+ops.antoClass).css({"position":"relative","display":"inline-block"});
		var read_only = ops.type=='n'?'':'readonly ';
		var hTxt='<input type="text" '+read_only+'class="auto-load" name="'+ops.fieldName+'" id="'+ops.fieldName+'"/>'
				+'<div class="auto-content"></div>'
				+'<div class="fixed-wrap"></div>';
		$('.'+ops.antoClass).append(hTxt); 
		
		var getArr= [],autoContent='',inpValue='',
		objParams={"elsAccount":ops.elsAccount,"tableName":ops.tableName,"fieldName":ops.fieldName,"fieldValue":""};
		var autoThis=$('.'+ops.antoClass);
		var scrollOption={
			init: function() {
				autoContent = autoThis.find('.auto-content').niceScroll({"cursorcolor":"#ccc"});
			},
			clear: function() {
				autoContent=null;
			}
		};
		scrollOption.init();
		/**
		 * 自动提示数据组装
		 */
		function antoShow(autoArr) {
			if(autoArr && autoArr.length) {
				var fieldStr='';
				$.each(autoArr,function(index, item) {
					var str='<p class="field-item">'+item.fieldValue+'_'+item.fieldValueText+'</p>';
					fieldStr +=str;
				});
				autoThis.find('.auto-content').html(fieldStr).show();
				autoThis.find('.fixed-wrap').show();
				if(!autoContent) {
					scrollOption.init();
				} else {
					autoContent.resize();
				}
				autoThis.find('.auto-content p').click(function(e) {
					autoThis.find('.auto-load').blur();
					inpValue = $(this).text();
					autoThis.find('.auto-load').val(inpValue);
					autoThis.find('.auto-content').hide();
					autoThis.find('.fixed-wrap').hide();
				});
				
				if(autoArr && autoArr.length == 1){
					inpValue = autoThis.find('.auto-content').eq(0).text();
				}
			}
		}
		/**
		 * 获取数据
		 */
		function getData(fieldV) {
			objParams.elsAccount = elsAccount;
			objParams.fieldValue = fieldV;
			$.ajax({
				url         : ops.getDateUrl,
				type        : "POST",
				contentType : "application/json",
				data        : JSON.stringify(objParams),
				dataType    : "json",
				success  : function(data) {
					if(data && data.rows && data.rows.length) {
						getArr=data.rows;
						antoShow(getArr);
					} else {
						autoThis.find('.auto-content').html('').hide();
						autoThis.find('.fixed-wrap').hide();
						getArr = [];
						//autoThis.find('.auto-load').val(inpValue);
					}  
				},
				error : function(data) {
					autoThis.find('.auto-content').html('').hide();
					autoThis.find('.fixed-wrap').hide();
					getArr = [];
					autoThis.find('.auto-load').val(inpValue);
				}
			}); 
		}
		autoThis.find('.auto-load').keyup(function() {
			getData($(this).val());
		});
		autoThis.find('.auto-load').focus(function() {
			getData($(this).val());
		});
		autoThis.find('.auto-load').blur(function() {
			autoThis.find('.auto-load').val(inpValue);
		});
		autoThis.find('.fixed-wrap').click(function() {
			autoThis.find('.auto-content').hide();
			autoThis.find('.auto-load').val(inpValue);
			autoThis.find(this).hide();
		});
	}
})(jQuery);
/**
 * 禁用backspace键返回上一个历史记录
 **/
var _stopIt=function(e){  
    if(e.returnValue){  
       e.returnValue = false ;  
    }  
    if(e.preventDefault ){  
       e.preventDefault();  
    }                 
  
    return false;  
}
document.onkeydown=function(){  
     
        //获取事件对象  
        var elem = event.relatedTarget || event.srcElement || event.target ||event.currentTarget;   
          
        if(event.keyCode==8){//判断按键为backSpace键  
          
                //获取按键按下时光标做指向的element  
                var elem = event.srcElement || event.currentTarget;   
                  
                //判断是否需要阻止按下键盘的事件默认传递  
                var name = elem.nodeName;  
                //增加一个contentEditable可编辑的状态
                if(name!='INPUT' && name!='TEXTAREA' && elem.contentEditable!="true"){  
                	return _stopIt(event);
                      
                }  
                var type_e = elem.type?elem.type.toUpperCase():'';  
                if(name=='INPUT' && (type_e!='TEXT' && type_e!='TEXTAREA' && type_e!='PASSWORD' && type_e!='FILE')){  
                        return _stopIt(event);  
                }  
                if(name=='INPUT' && (elem.readOnly==true || elem.disabled ==true)){  
                        return _stopIt(event);  
                }  
        }
 }
/**
 * 刷新消息中心和审批列表数字
 */
function refreshNum() {
	$.ajax({
		'cache':false,
		'url':basePath+'/rest/MsgService/getMsgCount/' + elsAccount + '/' + elsSubAccount,
		'success': function(data) {
			var msgCount, todoCount;
			msgCount = data['msgCount'] > 99 ? '99+' : data['msgCount'];
			todoCount = data['todoCount'] > 99 ? '99+' : data['todoCount'];
			top.$('#msgManage .icon div.txInfo').text(msgCount);
			top.$('#auditList .icon div.txInfo').text(todoCount);
		},
		'error': function() {
			console.log('getMsgCount error');
		}
	});
}
/**
 * 获取当前运行环境的路径 
 */
function getCurrAbsPath() {
	var local=location.href,jsPath;
	if(local) {
		var cur=/https?:\/\/.*?\/.*?\//.exec(local)[0];
		if(cur.indexOf('test.51qqt.com')) {
			//本地环境
			jsPath=cur;
		} else if (cur.indexOf('cs.51qqt.com')) {
			//测试环境
		} else if(cur.indexOf('www.51qqt.com')) {
			//正式环境
		}
		
	}
	return jsPath;
}
//初始化按钮限定字数，以及遮罩窗的基本拖曳功能
/*$(function(){
	//按钮提示
	$('button').not('.none-title').each(function(i,b){
			var txt = $(b).text();
			if(txt && txt.length) {
				b.title=b.title||$(b).text();
				$(b).text(textClip(txt,9));
			}
		});
	if($('button') && $('button').height()) {
		$('button').button();
	}
	//dilog-tip 拖曳
	$('.dialog-tip').each(function(index,html){
		var parent = $(html).parent();
		$(html).draggable({ containment: parent, scroll: false,cursor: "move" }).bind("drag",function(event,ui){
			//console.log($(this));
			//$(this).find("div.iframeFix").show();
		})
		.bind("dragstop", function(event, ui) {
			if(window.leftScroll) {
				window.leftScroll.resize();
			}
			if(window.rightScroll) {
				window.rightScroll.resize();
			}

		});
	});
	
	//处理页面自定义弹窗皮肤
	if(parent.elsDeskTop.loginStore && parent.elsDeskTop.loginStore.shemeType) {
		var subShemeType = parent.elsDeskTop.loginStore.shemeType; 
		$('.dialog-tip .tip-head').css({'background-color':'rgba('+subShemeType.r+','+subShemeType.g+','+subShemeType.b+','+subShemeType.a+')'});
	}
});*/



var defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAT0UlEQVR4Xu1deXRURb7+qm4HSIKigCIOqwqPQdzFZXDBBTAL6KigPAmdcZRRGVARRSGdNOngCDgooGcUFboTFDU8GUk6AUYQUVxQPCAqDChEXEABFQwJkO6qd+piMCTp5N6+dTfs+i8nVb+tvq5bVb+lCI6x5vf76QfblO4KIb0ZR3cC3o0w3oVTfhJA2oORtqBIAUMLBrQQ6lPgECgOgaEKFHsAtocwsotTsh0E2zjDNuKJft63Cyr8fj87lkxG3K7M9X8p6ByN4k8c0X4E6MsJzgJoqkl6VRLOPgUnaxjFah5h75a/6P/GJF6WkHUdAPpn+1sls6SrKCJpIEoawM+wxFIxmDCOLQrn5Uwh5VWIrlwZ9B+wUx69vF0BgKFD/S2qUpTrwDCMgQ2hlB6nV1GL+u8jHK8z4NXU6uiy4mL/IYv4xs3G0QBIH/loT0Iid4JxLyg9KW4tbRhIgB8YeJAS8nxp0LfFBhE0sXQgADhJz86/lkN5gHI+SJMWTu/E+BJC+eOlodwVAOFOEtcxABC79zXbPH8GeC4BznaSkaTJEsU66sHkkmDO604BggMAwEmG99F0RFkBFJwrzdjOJrSWE+SUBX1L7BbTVgAM9uafyUCfAPgAuw1hC3/GlwBkXLjIt9EW/gBsAcDArOmpSfRAgIGNpaCKXco7hG8E4E/SliyvZI6/ymqZLAdApjcwkDPyLCjvZrWyTubHGNmq0Oio0lDecivltAwAg0f5U9hB8jhA77ZSQbfxIozPqlTYBKsulCwBQObt+eewGrxMKOnltgmxQ14GfEoZHR4umvSp2fxNB0B6dkEWifI5oGhltjLHEn3GUEUV/tdwMPdlM/UyDQD9+/s9qV3IDBA6xkwFjnXanPAZqft7PVRcPCxqhq6mAGDI7VOPY9GDr3CQNDOE/r3R5OAlEZY8fFnRg/tl6y4dAINGTOnoASv7HV3qyJ6TRukx4OOkJJq++PlJ38tkKBUAg0f6uzDiWW63i1amgZxFi29mEXaNzBgEaQBI8wZOB7CCAl2cZbRjTBpGKpAUuSY8179VhmZSACB++RGivJ2YfBlTooEGIxWMRS6XsRIYBoD6zVf4qsSyr2HipHbhm5Uk5QqjewJDABC7/eihQ6sSGz6pM6uH2Noa1upKI6eDuAEgzvmtu9LFiaOenvmS31ccEVOrev053nuCuAGQMXLyrMQlj/wJjYeiuCwqC+Y+EM/YuACgXu9yXhgPw8QYkyxA+PB4ro11A0A4dngNeT9xt2/SRMZJVvUdgF6s14GkCwDCpRutpmsTXr04Z8nkYcKLWE2iffW4knUBICO74Glwfo/JeiTIG7AAJ5hZFvTdp5WEZgCokTzAUq2EndhPUSg6d2yPP3Rsh7ZtWiM5uQUqKytx4EAN9v5ShZ2792Lnrr2IRt2d/kfArtUaWaQJAEOH+ltXtfJscGMYV0pyS1x+UW9cekEv9OnZGa1aqfmgR9qOHTuO+vvgwRpsrtiJjz+twNpPK1B9wPHJPY381tiXKVXHnVVcPK66uR+iJgBkeAMzANzfHDEn/b992+NxU/qlGHjFuWjZIimmaPUBULfjoZoI3vloM8pXrsfP+yyP1zRkTg4+rSyUO6E5Is0CQIRuR8DXuyV61+NRcFPapbhl8GVo0cLTnP5oCgC1gwUQwm+uw7JVGxBxz+chElXQZ8lc33+bMkIzABBJG1OWuiVu/5STTsTDo2/EGd06NjvxtR20AKC2b8U3u/HsghXY/eMvmunb2pHzcLgwNzNuAGR4p2QArNRWJTQy792jM3LvuwWtU/WFHuoBgBClqvoQZoeW4YuvpMZlaNRSfzcCDCoN+ZbFGhlzBRC5eh9+oax1g6PnnN7dkXffLZqW/PqG0AsAMb6mJopZoWXY9OV3+mfE8hHso3Ao96JYuYgxAZDuLbiJgC+0XF6dDMVy/9jDWQ1291rJxAMAQfvAwRpMnxPG9u/2aGVlZ7/rwyHf4sYEiAEATtK9BeucnqUrlvvZ+XfipHZt4jZuvAAQDHf/9AsCs/+tfhac3EQ8YXko58LGVoFGAZCePXkA4TTmd8Mpyj48+iZc1vePhsQxAgDB+MNPtmLOgjcNyWDFYEJwVWnQt7I+r0YBkJZdsMTpxRkuOOt0TH5guGHbGQWAEODJeUvx2WaH14qKcSJoAIDDZVmiTZ4dDVvdIAFCgNmBUejW6WSDlKDpHqA5Jt/u/AmTZ70G7qjaHw2lVqKRHovnT/6i7n8aACDDmz8dIOObU9rO/198Xk/47h0mRQQZK4AQRBwNP9n0tRSZTCNCMDUc9D0cEwBqNa5W5BunF2Tyj7sVF54tpzqcLACs37gdTxX+x7S5k0GYgX3/Q8tTOq+d87eaWnpHrQAZ3sAQAK/LYGYWjeOPS0HRk/dBePZkNFkAEB7EBx59CfurDsoQyzQahCCjNOgraxwAWYH5oLjNNO4SCF9+cW9MuPtGCZQOk5AFAEHr2ZdW4KMN26TJZgYhRhAqD/qyGwBAVOBM5couAK3NYCyL5j0j05B+9QWyyEkFwIr3PseCxe9Jk80UQpztZW1O7FA+e6y6VB35BKSNnJJGCTuyNJjCXAJRcevXp1dXCZTkrwDiavifz5dLk80sQpywgWXBPHXDcgQAbgnzDs4YC+Hrl9VkfgJ+2rsfDz1maj0HWWo/EQ75xh0NAG/BFjekdy185qG47/0bs55MAAj/wBi/86PlOeObyopy1StUdQUQJdcjjG+XBS8z6ZTMmwQiboIkNZkA4Jxj1MS5kiQzl0wkSk9dOn/SDtWSmSMLbuGEu2Lteu25h9EiqflIH63mkwkA4Sa+JzeolbWt/QjH0NJC30IVAG75/gtZQ0/ci3YnyqsWLxMAP/5ciQlTX7F1YrUyZ+BPlody7/91BZj8Hif0Eq2D7ew3baIXvXt2liaCTABs3rZTjRFwRePs3XBhXj+iRv5sI/tMfGZFqj0S9wDSzLkvHMo5gYjSLhQ4ykMkjYUJhPpf0gfj77pBGmWZK4CICxDxAW5p3EO6kczsgsGc80bDhZyoyHGtk/HirHGgVM5JQBYARLj4uIIXXZVIwjhNF6FfYwn4TCdOdiyZRCCICAiR0WQBwA3ewAb24nw0cWPWzyXn90TOWGfFA7giKqghAh4nmVn5CzklN8n4NVlFQ1wEPV0wCl3+YPwdKRkrwFff7kbBU472oseammKS4Z38FkCvsGryZPHpe84ZyLv/VsPkZABgxvPl2OiKHIH65iJvkgxv/mcA6W3YkjYQeOTvN6PfhcYq0BsFwHsfb8Hc4lU2aC+BJccGkpEV2AGKUySQs5yEiA4SeQFGbgaNAOCHPfvUpd+dKeRiutgOsQncC0Cef9ViGPTofioeeySryRTwpkSKFwBVBw5h6jOl+O77nyzWWB47xvCzWAGq3V7wSRwJc+4dhiSP/ven4gHAwUMRzJy3FFsqdsqbDRsoMbBqkpYViFIqXlB3dxMJohPH3IzU5Ja6FNELgMr9BzC78D/Yuv0HXXyc2JkxsGMGAMLAnTq2wyOjb0bXTtqPh3oAIBJBn3lxBXb9uM+J86lbJhUAx8InoK7mJxyfioKHbtOcNaQVAGLyZ7xQ7viwbz0oUD8Bbt8E1ip8Xp/TcF3/8yHuB/QEjGgFgOAjAj7Wb9qOtz7Y5JLaAE3DoXYT6NpjoHAIXf2ns3Fj2iVx3wrqAUBdc4p8wKWrPsH7676ECAVzZzt8DBRv053pNgWEP8B789XofGp7Q6LHC4BapgIIi5Z9BOEMcl1TL4JcdhUsQsL/np3uuNxAkRhatOgdl5WTI2+6yhk04PJzMeq2gUiuV+zRyC/P6ApQl7e4EVxQ8j7E9bBLmnAGOb8IpCj0ONqbhqv7nS3drjIBUCucKC750uvvoiZiyluP0mxAOKaTjOzAGHDMkkZVMiFxrBMBIKd3NcddYQYAhAkqvtmFWcFl+GX/AckWkUhOBISkjwxkEoISiWSlkTq1Q1sExv8vOpx0gjSa9QmZBQDBZ9eefXhi7lLHXhypIWEZt/tPQ1T50jQLx0m448knYurEkWh7grwcgMZEMRMAgp/IFxROoz0/V8ZpCfOGUR7t+mtYuCI8go5JCxc7/WmTvDjZQPk3rWYzGwDqSvDjPkx9JqyWpHdM42xvuDD3RMclhogN3/ScbJzWpYMltrICAIf3BLsxbU6pepvoiBbF6vB832WHAZCVP5NTMtYJgk2450a1vr9VzSoACH3WrN+K5152TE1BNUVcBUC6N38YAbE9qS3zmgtxV9Z1Vs29ysdKAAh+RYtWY9WaTZbq2BgzDnJzWSjn/1QApN3m70Q9iq01zjqd0g4z8++IO7InXotaDQARTJI/axFEOJmdjZNox7Kgf2edEjGBzZSgh11CiU2fKPludbMaAEK/zVt3YPpztlbj2RgO+dTv7BEA2LkP6H9pH4z/m7x8Pz0gsgMAQj478wjrvjR6BADp2YHrCIflFY6E7/65aaMNRfbqmfD6fe0CgKglMOnxYnueoOEYEC70vXHUCvBrmTjxDIalEcKZ1/bFXSMGGZlDQ2PtAoAQev6/V6vBJVY2EQTS+kC0Q3GxX61xf1SKbebIQCEnyLJKII9C1V+/kXr/RmW1EwDi7aGcGQstfaeQA/PKQr7ba+12FACs9guIWv+i5r+dzU4ACL3/NX85Pv6swjITcIK0sqBvSaMAEMWiq1OUrzlgvA67BpXyHxiO8yWleWtg12gXuwGw4b9fq15DSxrDzp3JJ3eJWSxaCJHuzZ9KQB4yWyCRziWKPsos+RaPzHYDgDGOCVNftiSSiAP/KAv5Jta1U4MyG5nZgR6cY3M8xtQzJu2qC9QgD7ub3QAQ+he+9g7e/tD8NzoYcEZ5yHeU57fROisZWfnloMTUO1nxxt9F59p273QEd04AwLrPt+PpInPfGiBAaWnIN7j+D65RAGR6J1/DQdVzohlN1Pp/9V8PWn7t25guTgCAeLB6bH4RxOfArEYZ719SlPuWJgAAnGSMKPjYrEcjhat3Vv6dZumqi64TACAE9s98DSLE3JwW+/HImKW2BmcHbmAci8wQaNCV52HMXzLMIK2bplMAEFz4NlavNWvrRTPDoUmNVrBsotaaeDi64EMA8l5n+HV6Rt02CEMG9NU9WWYMcAoA3lj9GV4pfV++igQfhIM5l+p+OlY9EprkH3DKBlDo6BQArPv8KzxdJH/bRcCuLQ3lLY+FrGarLZpxInhKvPnX2ZK7pmZ/UU4BgMg+Fs/QymwMWFwe8l3fFE0NAAj8kVG2gYLqL78Rg3Phk/eh7QnOiEF1CgB+3leFB/+xQN78M1ZDFHpmadDXZJpSswAQEsl+TFIcAVN0VvKQZ5mjKTkFACKtbOzkInlqEv5oOJg7qTmCmgAweJQ/JVLt2UApP605glr+//oLE6W9+6eFX1N9nAIAUWv47px5RtVRxzOOLdU0evbKoL/ZtCRNABBEzb4ckqJ5gohqgVgvhTdmHs0AUEHgoPDxxFw3boG64V5abKQLACJqKJkrH1KgjxbiiT7WWoBzrOdt2lxc+yikFu66AKBuCLOm9GFgH1CKFC0MEn0ss0AlGC4KF/k26uGoGwCCeLq3YDgBf0kPo0Rfcy1Q+wqYXi5xAUBdCVxQWEKvMdzan4NPKwvlTohH/rgBMHToq8r+lE2LCEgDH3M8giTGxGcBBr6odVWvocXFw+LKOo0bAELcoUP9rStTlLcocH584idGGbEAB1ujtORXlczxx513bggAQvghd0zpEK2JrgJITyPKJMbqtsBGRpUry+dN3KV7ZJ0BhgEgaKnJpdTzNijvZkSYxFhtFuBg2yhXLi8tzPlW24jYvaQAQN0UilIzNZ7lCRAYnZKmx4vJZ4RfvSTol5JMIA0AQuzDr5CzNxKfA3NAIJ59p4ReK+OXXyuhVAD8tidgIvxIeiSROWZ1B1Wx4eM0KdPoN7++ttIBUHs62J9CX0ocEeWASxz1PC3ZCCO7/ViSmAKAwyB4Vdmfumka4WScHDP8PqmIS57Uql4T4z3nN2c10wBQyzgjO/9WFiUvJHwHzU1Fg/9XcpBsUcdH90gdA0wHgHpCEA4kyhYkvIjaZkZ49RSq3FoSnGh68QBLAHD4kzAjubpV5WNOKUenbSps6fVPdnybSXpcukaktAwAtUKKyKIoU+bICi8zoryTxoowLoViVGnQt9JKuSwHgFBOxBhGD9I8AnWD6LFSYcfxYqwGCpmesr91QXHxuGqr5bMFALVKXnd74H+UCGaAIN1qxZ3AT8TtKwTjmwvdNlNWWwHw22chMJCDTQHohWYq6xjaBB8QziY1lbFjlayOAMBhZdVcxMEMyDt23cvsI8DjD4cmlsXK1bNq4mv5OAgAtSJxkjEyvz9Axx8rnwZRnIEw/nhJkU+4zc0rAhAHehwIgN+0GDIi74yox3MH4yybglpTPz4OIzY6hGEnp5jHgRfql2WRxUIGHUcDoFbBC0Y9m9Tx0A8DosAwytgNILSNDOVl01Bf4qRYBIJXv29x8vK61bhk85JFzxUAqKts2phZLckvP11BOE3jjKcRSnrJMkacdDZywssJI+Up1dFVtRU446Rl+TDXAaC+hQaNmNIxibJ+UcL7Uc4vYhxnUUrNemhoH6LYAAVrOMhqkMhqUXLd8lmTyND1AGhoC07S/zqlC68hvSmi3UHQHSBdAdIenLcHYe0Zo8mgrCUYbamOp+wgGD1IKasGp7tByG6A7yYcFRy8gkHZ5kHNZyWFeV87bRNnFAv/DxFEe2PsvIH5AAAAAElFTkSuQmCC';

var iconSys = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGhlaWdodD0iMjA0OHB4IiBzdHlsZT0ic2hhcGUtcmVuZGVyaW5nOmdlb21ldHJpY1ByZWNpc2lvbjsgdGV4dC1yZW5kZXJpbmc6Z2VvbWV0cmljUHJlY2lzaW9uOyBpbWFnZS1yZW5kZXJpbmc6b3B0aW1pemVRdWFsaXR5OyBmaWxsLXJ1bGU6ZXZlbm9kZDsgY2xpcC1ydWxlOmV2ZW5vZGQiIHZpZXdCb3g9IjAgMCAyMDQ4IDIwNDgiIHdpZHRoPSIyMDQ4cHgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgIDwhW0NEQVRBWwogICAgLmZpbDcge2ZpbGw6bm9uZX0KICAgIC5maWwwIHtmaWxsOiM0MjQyNDJ9CiAgICAuZmlsMyB7ZmlsbDojMzU3MkI4O2ZpbGwtcnVsZTpub256ZXJvfQogICAgLmZpbDYge2ZpbGw6IzczM0Q5MTtmaWxsLXJ1bGU6bm9uemVyb30KICAgIC5maWwyIHtmaWxsOiM3QTk0M0I7ZmlsbC1ydWxlOm5vbnplcm99CiAgICAuZmlsNCB7ZmlsbDojQjIxRjE3O2ZpbGwtcnVsZTpub256ZXJvfQogICAgLmZpbDUge2ZpbGw6I0VCNkQxRDtmaWxsLXJ1bGU6bm9uemVyb30KICAgIC5maWwxIHtmaWxsOiNGQ0I4MjU7ZmlsbC1ydWxlOm5vbnplcm99CiAgIF1dPgogIDwvc3R5bGU+PC9kZWZzPjxnIGlkPSJMYXllcl94MDAyMF8xIj48ZyBpZD0iXzMzNzg3NzY4OCI+PHBvbHlnb24gY2xhc3M9ImZpbDAiIGlkPSJfMzM3ODc5ODk2IiBwb2ludHM9IjkxMy44MDcsNjMyLjQ2MSA5MDEuNjQ4LDYyMS4xNDcgMzUzLjgwMiwxMjExLjM1IDM2NS45NiwxMjIyLjY2ICIvPjxwb2x5Z29uIGNsYXNzPSJmaWwwIiBpZD0iXzMzNzg4MDAxNiIgcG9pbnRzPSI0MDIuNDQzLDEyOTkuNjggMzk4LjU0NiwxMzE1Ljc5IDg4Ni45NjYsMTQzMy41OCA4OTAuODY0LDE0MTcuNDggIi8+PHBvbHlnb24gY2xhc3M9ImZpbDAiIGlkPSJfMzM3ODgwNDAwIiBwb2ludHM9IjE2MjguNzIsODc3LjQ2MSAxNjEyLjU0LDg3My44MjMgMTU1MC4xMiwxMTQ3LjgxIDE1NjYuMywxMTUxLjQ1ICIvPjxwb2x5Z29uIGNsYXNzPSJmaWwwIiBpZD0iXzMzNzg3OTM5MiIgcG9pbnRzPSIxMTA2LjEsMTQxNi42IDExMTIuMzksMTQzMS45IDE0NzAuNzcsMTI2OS44OSAxNDY0LjQ4LDEyNTQuNTkgIi8+PHBvbHlnb24gY2xhc3M9ImZpbDAiIGlkPSJfMzM3ODc5MDA4IiBwb2ludHM9Ijk0My45MzksMTM1My40MyA5NTguNDUsMTM0NS4yOSA4NDMuNjQzLDExNDEuNTQgODI5LjEzMSwxMTQ5LjY3ICIvPjxwb2x5Z29uIGNsYXNzPSJmaWwwIiBpZD0iXzMzNzg3OTA1NiIgcG9pbnRzPSI4NjUuODE1LDEwNDQuNDggODcxLjY2NSwxMDYwLjAxIDE1MzcuODksODA4LjA3NyAxNTMyLjA0LDc5Mi41MzggIi8+PHBvbHlnb24gY2xhc3M9ImZpbDAiIGlkPSJfMzM3ODc5MjI0IiBwb2ludHM9IjEwMzcuMDIsNTcwLjU0OCAxMDMyLjU0LDU4Ni41NDggMTUyOS4wNiw3MjcuMTI3IDE1MzMuNTUsNzExLjEyOSAiLz48cG9seWdvbiBjbGFzcz0iZmlsMCIgaWQ9Il8zMzc4NzkwMzIiIHBvaW50cz0iMTAxMi4zNyw2MTcuODEzIDk5OS42ODcsNjI4LjU0MSAxNDYyLjY1LDExNzYuNDEgMTQ3NS4zMywxMTY1LjY4ICIvPjxwb2x5Z29uIGNsYXNzPSJmaWwwIiBpZD0iXzMzNzg3ODc5MiIgcG9pbnRzPSIxNTY1LjU1LDg0Ni4wMjEgMTU1My41Myw4MzQuNTgyIDEwNTguNzcsMTM1My43NyAxMDcwLjc5LDEzNjUuMjEgIi8+PHBvbHlnb24gY2xhc3M9ImZpbDAiIGlkPSJfMzM3ODc4NjcyIiBwb2ludHM9Ijk4Mi44MDgsNjM5LjQyIDk2Ni4xMjUsNjM5LjQyIDk2Ni4xMjUsMTM0MS44NCA5ODIuODA4LDEzNDEuODQgIi8+PHBvbHlnb24gY2xhc3M9ImZpbDAiIGlkPSJfMzM3ODc4NDMyIiBwb2ludHM9IjkxOS40MjcsNjMwLjYxMiA5MDMuMjI0LDYyNi44MzcgODEyLjU0NCwxMDA5LjgzIDgyOC43NDgsMTAxMy42MSAiLz48cG9seWdvbiBjbGFzcz0iZmlsMCIgaWQ9Il8zMzc4NzgzODQiIHBvaW50cz0iMzgzLjIwOCwxMjI3LjA2IDM4OS4wNTgsMTI0Mi42IDczNS4xMiwxMTExLjczIDcyOS4yNywxMDk2LjE5ICIvPjxwYXRoIGNsYXNzPSJmaWwxIiBkPSJNMTY1NS4wNiA2MTcuMjg3YzM3LjgxMywwIDcyLjA1MDgsMTUuMzMwNyA5Ni44MzE2LDQwLjExMTQgMjQuNzgwNywyNC43ODA3IDQwLjExMTQsNTkuMDE4NSA0MC4xMTE0LDk2LjgzMTYgMCwzNy44MTMgLTE1LjMzMDcsNzIuMDUwOCAtNDAuMTExNCw5Ni44MzE2IC0yNC43ODA3LDI0Ljc4MDcgLTU5LjAxODUsNDAuMTEwMyAtOTYuODMxNiw0MC4xMTAzIC0zNy44MTMsMCAtNzIuMDUwOCwtMTUuMzI5NSAtOTYuODMwNCwtNDAuMTEwMyAtMjQuNzgwNywtMjQuNzgwNyAtNDAuMTEwMywtNTkuMDE4NSAtNDAuMTEwMywtOTYuODMxNiAwLC0zNy44MTMgMTUuMzI5NSwtNzIuMDUwOCA0MC4xMTAzLC05Ni44MzE2IDI0Ljc3OTUsLTI0Ljc4MDcgNTkuMDE3NCwtNDAuMTExNCA5Ni44MzA0LC00MC4xMTE0eiIgaWQ9Il8zMzc4Nzg2MjQiLz48cGF0aCBjbGFzcz0iZmlsMiIgZD0iTTE1MjguNDcgMTEzNS4zNGMyNC4wMTY2LDAgNDUuNzYwNyw5LjczNzAyIDYxLjUsMjUuNDc1MiAxNS43Mzk0LDE1LjczOTQgMjUuNDc1MiwzNy40ODQ3IDI1LjQ3NTIsNjEuNSAwLDI0LjAxNjYgLTkuNzM1ODMsNDUuNzYwNyAtMjUuNDc1Miw2MS41IC0xNS43Mzk0LDE1LjczODIgLTM3LjQ4MzUsMjUuNDc1MiAtNjEuNSwyNS40NzUyIC0yNC4wMTQyLDAgLTQ1Ljc2MDcsLTkuNzM3MDIgLTYxLjUsLTI1LjQ3NTIgLTE1LjczODIsLTE1LjczOTQgLTI1LjQ3NTIsLTM3LjQ4MzUgLTI1LjQ3NTIsLTYxLjUgMCwtMjQuMDE1NCA5LjczNzAyLC00NS43NjA3IDI1LjQ3NTIsLTYxLjUgMTUuNzM5NCwtMTUuNzM4MiAzNy40ODU5LC0yNS40NzUyIDYxLjUsLTI1LjQ3NTJ6IiBpZD0iXzMzNzg3ODg0MCIvPjxwYXRoIGNsYXNzPSJmaWwzIiBkPSJNOTk5LjM0OCAxMzMwLjMxYzMzLjY2OTcsMCA2NC4xNTUyLDEzLjY0ODggODYuMjIxNywzNS43MTU0IDIyLjA2NTQsMjIuMDY1NCAzNS43MTY2LDUyLjU1MiAzNS43MTY2LDg2LjIyMTcgMCwzMy42Njk3IC0xMy42NSw2NC4xNTUyIC0zNS43MTY2LDg2LjIyMTcgLTIyLjA2NTQsMjIuMDY2NiAtNTIuNTUyLDM1LjcxNjYgLTg2LjIyMTcsMzUuNzE2NiAtMzMuNjY5NywwIC02NC4xNTUyLC0xMy42NTEyIC04Ni4yMjE3LC0zNS43MTY2IC0yMi4wNjY2LC0yMi4wNjc3IC0zNS43MTU0LC01Mi41NTIgLTM1LjcxNTQsLTg2LjIyMTcgMCwtMzMuNjY5NyAxMy42NDg4LC02NC4xNTQgMzUuNzE1NCwtODYuMjIwNSAyMi4wNjY2LC0yMi4wNjU0IDUyLjU1MiwtMzUuNzE2NiA4Ni4yMjE3LC0zNS43MTY2eiIgaWQ9Il8zMzc4NzgyNDAiLz48cGF0aCBjbGFzcz0iZmlsNCIgZD0iTTMzNC44MzkgMTIwMy4zOWMyMS43Njc3LDAgNDEuNDc5Miw4LjgyNzU3IDU1Ljc0NjksMjMuMDk0MSAxNC4yNjY1LDE0LjI2NzcgMjMuMDk0MSwzMy45NzkyIDIzLjA5NDEsNTUuNzQ2OSAwLDIxLjc2ODkgLTguODI1Miw0MS40ODAzIC0yMy4wOTQxLDU1Ljc0ODEgLTE0LjI2NTQsMTQuMjY2NSAtMzMuOTc4LDIzLjA5NDEgLTU1Ljc0NjksMjMuMDk0MSAtMjEuNzY4OSwwIC00MS40ODE1LC04LjgyNzU3IC01NS43NDY5LC0yMy4wOTQxIC0xNC4yNjg5LC0xNC4yNjc3IC0yMy4wOTQxLC0zMy45NzkyIC0yMy4wOTQxLC01NS43NDgxIDAsLTIxLjc2ODkgOC44MjUyLC00MS40NzkyIDIzLjA5NDEsLTU1Ljc0NjkgMTQuMjY1NCwtMTQuMjY2NSAzMy45NzgsLTIzLjA5NDEgNTUuNzQ2OSwtMjMuMDk0MXoiIGlkPSJfMzM3ODc4OTM2Ii8+PHBhdGggY2xhc3M9ImZpbDUiIGQ9Ik05NTguMTcyIDQ3My44MTNjMjQuMDE0MiwwIDQ1Ljc2MDcsOS43MzcwMiA2MS41LDI1LjQ3NjQgMTUuNzM4MiwxNS43MzgyIDI1LjQ3NTIsMzcuNDgzNSAyNS40NzUyLDYxLjUgMCwyNC4wMTQyIC05LjczNzAyLDQ1Ljc2MDcgLTI1LjQ3NTIsNjEuNDk4OSAtMTUuNzM5NCwxNS43Mzk0IC0zNy40ODU5LDI1LjQ3NjQgLTYxLjUsMjUuNDc2NCAtMjQuMDE1NCwwIC00NS43NjA3LC05LjczNzAyIC02MS41LC0yNS40NzY0IC0xNS43Mzk0LC0xNS43MzgyIC0yNS40NzUyLC0zNy40ODQ3IC0yNS40NzUyLC02MS40OTg5IDAsLTI0LjAxNTQgOS43MzU4MywtNDUuNzYxOCAyNS40NzUyLC02MS41IDE1LjczOTQsLTE1LjczOTQgMzcuNDg0NywtMjUuNDc2NCA2MS41LC0yNS40NzY0eiIgaWQ9Il8zMzc4Nzc2MTYiLz48cGF0aCBjbGFzcz0iZmlsNiIgZD0iTTc5OS44NjkgOTk3LjgzNGMyMi44NzA5LDAgNDMuNTgwMyw5LjI3NDAyIDU4LjU2OTcsMjQuMjYyMiAxNC45ODgyLDE0Ljk4OTQgMjQuMjYyMiwzNS42OTg4IDI0LjI2MjIsNTguNTcwOSAwLDIyLjg3MDkgLTkuMjc0MDIsNDMuNTc5MiAtMjQuMjYyMiw1OC41Njg1IC0xNC45ODk0LDE0Ljk4ODIgLTM1LjY5ODgsMjQuMjYyMiAtNTguNTY5NywyNC4yNjIyIC0yMi44NzIxLDAgLTQzLjU4MTUsLTkuMjc0MDIgLTU4LjU2OTcsLTI0LjI2MjIgLTE0Ljk4OTQsLTE0Ljk4OTQgLTI0LjI2MjIsLTM1LjY5NzcgLTI0LjI2MjIsLTU4LjU2ODUgMCwtMjIuODcyMSA5LjI3Mjg0LC00My41ODE1IDI0LjI2MjIsLTU4LjU3MDkgMTQuOTg4MiwtMTQuOTg4MiAzNS42OTc3LC0yNC4yNjIyIDU4LjU2OTcsLTI0LjI2MjJ6IiBpZD0iXzMzNzg3Nzg4MCIvPjwvZz48L2c+PHJlY3QgY2xhc3M9ImZpbDciIGhlaWdodD0iMjA0OCIgd2lkdGg9IjIwNDgiLz48L3N2Zz4=';
var iconMsg ='data:image/png;base64,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';

var iconOrder='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDEyOCAxMjgiIGlkPSLQodC70L7QuV8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNDAsMTguM1YxNGMwLTUuNSw0LjUtMTAsMTAtMTBoNDUuOWMyLjcsMCw1LjIsMS4xLDcuMSwyLjlsMTQuMSwxNC4xYzEuOSwxLjksMi45LDQuNCwyLjksNy4xVjk5ICBjMCw1LjUtNC41LDEwLTEwLDEwSDg1LjMiIGZpbGw9IiM0MkFDQjciLz48cGF0aCBkPSJNOTQsMTA5VjQzLjFjMC01LjMtMi4xLTEwLjQtNS45LTE0LjFMNzQsMTQuOUM3MC4yLDExLjEsNjUuMiw5LDU5LjksOUg0MS4zYy0wLjksMS41LTEuMywzLjItMS4zLDV2NC4zICBMODUuMywxMDlIOTR6IiBvcGFjaXR5PSIwLjEiLz48cGF0aCBkPSJNNzQsMTI0SDE0Yy01LjUsMC0xMC00LjUtMTAtMTBWMjljMC01LjUsNC41LTEwLDEwLTEwaDQ1LjljMi43LDAsNS4yLDEuMSw3LjEsMi45bDE0LjEsMTQuMSAgYzEuOSwxLjksMi45LDQuNCwyLjksNy4xVjExNEM4NCwxMTkuNSw3OS41LDEyNCw3NCwxMjR6IiBmaWxsPSIjRjBFRjk4Ii8+PHBhdGggZD0iTTE0LDExNFYyOWMwLTUuNSw0LjUtMTAsMTAtMTBIMTRDOC41LDE5LDQsMjMuNSw0LDI5djg1YzAsNS41LDQuNSwxMCwxMCwxMGgxMEMxOC41LDEyNCwxNCwxMTkuNSwxNCwxMTR6IiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTE0LDEyNS41aDYwYzYuMywwLDExLjUtNS4yLDExLjUtMTEuNXYtMy41SDExMGM2LjMsMCwxMS41LTUuMiwxMS41LTExLjVWMjguMWMwLTMuMS0xLjItNi0zLjQtOC4xTDEwNCw1LjkgIGMtMi4yLTIuMi01LjEtMy40LTguMS0zLjRINTBjLTYuMywwLTExLjUsNS4yLTExLjUsMTEuNXYzLjVIMTRDNy43LDE3LjUsMi41LDIyLjcsMi41LDI5djg1QzIuNSwxMjAuMyw3LjcsMTI1LjUsMTQsMTI1LjV6ICAgTTQxLjUsMTRjMC00LjcsMy44LTguNSw4LjUtOC41aDQ1LjljMi4zLDAsNC40LDAuOSw2LDIuNUwxMTYsMjIuMWMxLjYsMS42LDIuNSwzLjcsMi41LDZWOTljMCw0LjctMy44LDguNS04LjUsOC41SDg1LjV2LTE3SDEwOSAgYzAuOCwwLDEuNS0wLjcsMS41LTEuNXMtMC43LTEuNS0xLjUtMS41SDg1LjV2LTE3SDEwOWMwLjgsMCwxLjUtMC43LDEuNS0xLjVzLTAuNy0xLjUtMS41LTEuNUg4NS41VjQzLjFjMC0zLjEtMS4yLTYtMy40LTguMSAgTDY4LDIwLjljLTIuMi0yLjItNS4xLTMuNC04LjEtMy40SDQxLjVWMTR6IE01LjUsMjljMC00LjcsMy44LTguNSw4LjUtOC41aDQ1LjljMi4zLDAsNC40LDAuOSw2LDIuNUw4MCwzNy4xYzEuNiwxLjYsMi41LDMuNywyLjUsNiAgVjExNGMwLDQuNy0zLjgsOC41LTguNSw4LjVIMTRjLTQuNywwLTguNS0zLjgtOC41LTguNVYyOXoiIGZpbGw9IiM2MjM1NUMiLz48cGF0aCBkPSJNMTksMTA1LjVoNTBjMC44LDAsMS41LTAuNywxLjUtMS41cy0wLjctMS41LTEuNS0xLjVIMTljLTAuOCwwLTEuNSwwLjctMS41LDEuNVMxOC4yLDEwNS41LDE5LDEwNS41eiIgZmlsbD0iIzYyMzU1QyIvPjxwYXRoIGQ9Ik0xOSw4NS41aDUwYzAuOCwwLDEuNS0wLjcsMS41LTEuNXMtMC43LTEuNS0xLjUtMS41SDE5Yy0wLjgsMC0xLjUsMC43LTEuNSwxLjVTMTguMiw4NS41LDE5LDg1LjV6IiBmaWxsPSIjNjIzNTVDIi8+PC9zdmc+';