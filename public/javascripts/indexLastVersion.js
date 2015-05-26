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

//全局变量，数据的长度
var size = 128;

//设置analyserNode节点的fft属性的大小，即每次分析的资源的大小
analyserNode.fftSize = size * 2;
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
		//console.log(arr);
		
		//绘制图形（柱状图，圆点）
		drawGraph(arr);
		
		requestAnimationFrame(v);
	}
	
	requestAnimationFrame(v);
}

//调用音频分析函数
visualizer();


//将音频资源进行可视化制作，取得盒子div(放置柱状图)
var box = $("#box")[0];
var height,width;

//定义一个canvas画布元素
var canvas = document.createElement('canvas');

//获取ctx上下文对象,(2D图形)
var ctx = canvas.getContext("2d");

//将画布canvas添加到div展示区中
box.appendChild(canvas);

//定义一个线性渐变,纵向
var line;

//定义一个圆形渐变
var g;

/**
 * 产生一个m-n之间的一个整数
 * @param {Object} m
 * @param {Object} n
 */
function random(m,n){
	return Math.round(Math.random()*(n - m) + m);
}

//点的集合数组
var Dots = [];

function getDots(){
	//每次调用之间清空Dots数组中的数组
	Dots = [];
	for(var i = 0; i < size; i++){
		var x = random(0, width);
		var y = random(0,height);
		var color = "rgb(" + random(0,255) + "," + random(0,255) + "," + random(0,255) + ")";
		
		Dots.push({
			x: x,
			y: y,
			color: color
		});
	}
}

/**
 * 创建一个函数，在窗口大小改变的时候动态地获取窗口的高度和宽度
 */
function resize(){
	//获取当前窗口的高度和宽度
	height = box.clientHeight;
	width = box.clientWidth;
	
	//分别给canvas的高度和宽度赋值
	canvas.height = height;
	canvas.width = width;
	
	//创建线性渐变,纵向
	line = ctx.createLinearGradient(0, 0, 0, height);
	
	//为线性渐变添加渐变色
	line.addColorStop(0,"red");
	line.addColorStop(0.5,"yellow");
	line.addColorStop(1,"green");
	
	//每次改变窗口大小的时候，获取Dot数组
	getDots();
	
}

//先初始化加载一次
resize();

//getDots();

//调用resize()函数，当窗口改变的时候调用
window.onresize = resize;

/**
 * 绘制图形（柱状图，圆点）
 * @param {Object} arr
 */
function drawGraph(arr){
	//每次在绘制之前需要将上一次的数据给清除掉，不然会有一个叠加的过程
	ctx.clearRect(0, 0, width, height);
	
	//宽度
	var w = width / size;
	
	//应用到ctx的sillStyle上,每次调用之前默认应用上线性渐变
	ctx.fillStyle = line;
	
	//for循环
	for(var i = 0;i < size; i++){
		
		//判断绘制图形的类型（柱状还是点状）
		if(drawGraph.type == "column"){
			
			//高度是动态变化的
			var h = (arr[i] / 256) * height;
		
			//填充canvas
			ctx.fillRect(w * i, height - h, w * 0.6, h);
		}else if(drawGraph.type == "dot"){
			//重新绘制(起始位置归0)
			ctx.beginPath();
			
			var o = Dots[i];
			var r = (arr[i] / 256) * 50;
			
			//绘制圆形
			ctx.arc(o.x, o.y, r, 0, Math.PI*2, true);
			
			//创建一个渐变
			g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
			g.addColorStop(0,"#fff");
			g.addColorStop(1,o.color);
			
			ctx.fillStyle = g;
			ctx.fill();
			
			//白色
			/*ctx.strokeStyle = "#fff";
			ctx.stroke();*/
		}
		
	}
}

//为drawGraph函数绑定一个属性（是画柱状图还是圆点）,默认是画柱状图
drawGraph.type = "column";

//获取可视化显示的类型
var types = $("#type li");

/**
 * 鼠标点击的时候，改变显示效果
 */
for(var i = 0; i < types.length; i++){
	types[i].onclick = function(){
		for(var j = 0; j < types.length; j++){
			types[j].className = "";
		}
		this.className = "selected";
		
		//获取类型
		drawGraph.type = this.getAttribute("data-type");
	}
}

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
