function $(s){
	return document.querySelectorAll(s);
}

var list = $("#list li");
var list_length = list.length;

for(var i = 0;i< list_length;i++){
	list[i].onclick = function(){
		for(var j = 0;j < list_length;j++){
			list[j].className = "";
		}
		this.className = "selected";
		load("/media/"+this.title);
	}
}

//定义一个request对象，发起ajax请求
var xhr = new XMLHttpRequest();
//创建一个AudioContext上下文对象
var ac = new (window.AudioContext || window.webkitAudioContext)();
//增加一个控制音量的对象gainNode
var gainNode = ac[ac.createGain()?"createGain":"createGainNode"]();

//将gainNode对象连接到destination最终节点上
gainNode.connect(ac.destination);

//用于保存播放的音频资源
var source = null;
//计数，用于保存当前点击了几个资源
var count = 0;

//定义一个分析音频资源的对象
var analyserNode = ac.createAnalyser();
//设置analyserNode节点的fft属性的大小，即每次分析的资源的大小
analyserNode.fftSize = 512;
analyserNode.connect(gainNode);


/**
 * 定义一个ajax请求方法
 * @param {Object} url
 */
function load(url){
	var n = ++count;
	//在每次播放资源之前都要进行判断，之前是否已经有资源存在，如果有资源存在，就停止当前播放
	source && source[source.stop ? "stop" : "noteOff"]();

	/*if(source){
		source[source.stop ? "stop" : "noteOff"]();
	}*/
	
	//将资源终止播放
	xhr.abort();
	xhr.open("GET",url);
	//定义服务器端返回的数据类型，二进制缓冲区
	xhr.responseType = "arraybuffer";
	
	xhr.onload = function(){
		//如果还未解码成功，但是已经点击了
		if(n != count){
			return;
		}
		//console.log(xhr.response);
		//使用上下文对象进行音频解码操作
		ac.decodeAudioData(xhr.response,function(arrayBuffer){
			//如果已经解码成功，并且也已经点击了
			if(n != count){
				return;
			}
			//使用上下文对象创建bufferSource对象
			var bufferSource = ac.createBufferSource();
			bufferSource.buffer = arrayBuffer;
			
			//先将bufferSource对象连接到analyserNode节点上
			bufferSource.connect(analyserNode);
			
			/*//再将analyserNode连接到gainNode节点上，就可以控制音量大小了
			analyserNode.connect(gainNode);*/
			/*//最后连接到destination上（所有的资源都需要连接到destination上）
			bufferSource.connect(ac.destination);*/

			//播放音频资源
			bufferSource[bufferSource.start?"start":"noteOn"](0);
			source = bufferSource;
		},function(err){
			console.log(err);
		});
	}
	
	//向服务端发起ajax请求
	xhr.send();
}

/**
 * 分析音频资源函数
 */
function visualizer(){
	var arr = new Uint8Array(analyserNode.frequencyBinCount);
	
	/*//此时这里只能输出一次，开始的时候输出了一次
	console.log(arr);*/
	
	//使用一个动画函数，使得可以持续的分析音频资源
	requestAnimationFrame = window.requestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							window.mozRequestAnimationFrame;
						
	function v(){
		analyserNode.getByteFrequencyData(arr);
		console.log(arr);
		requestAnimationFrame(v);
	}
	
	requestAnimationFrame(v);
}

//调用音频分析函数
visualizer();

/**
 * 改变音量大小
 * @param {Object} percent
 */
function changeVolume(percent){
	gainNode.gain.value = percent * percent;
}

//为音量按钮绑定改变事件
$("#volume")[0].onchange = function(){
	changeVolume(this.value/this.max);
}

//页面一加载，就调用一下改变音量的事件，使得默认的60生效
$("#volume")[0].onchange();
