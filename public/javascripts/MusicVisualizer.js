/*上下文，全局对象*/
MusicVisualizer.ac = new (window.AudioContext || window.webkitAudioContext)();

/**
 * 优化代码,将核心功能封装成类
 * 构造函数
 */
function MusicVisualizer(obj){
	//用于保存播放的音频资源
	this.source = null;
	//计数，用于保存当前点击了几个资源
	this.count = 0;
	
	///定义一个分析音频资源的对象（数据分析节点）
	this.analyser = MusicVisualizer.ac.createAnalyser();
	//数据的长度
	this.size = obj.size;
	//设置analyserNode节点的fft属性的大小，即每次分析的资源的大小
	this.analyser.fftSize = this.size * 2;
	
	//调节音量控制节点
	this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain()?"createGain":"createGainNode"]();
	//先将音量控制节点连接到destination最终节点上
	this.gainNode.connect(MusicVisualizer.ac.destination);
	//将数据分析节点连接到音量控制节点上
	this.analyser.connect(this.gainNode);
	
	//获取XMLHttpRequest对象，调用Ajax
	this.xhr = new XMLHttpRequest();
	
	//可视化对象（绘制图形）
	this.drawGraph = obj.drawGraph;
	
	//调用音频数据可视化函数
	this.visualize();
}

/**
 * 加载函数
 * @param {Object} url 资源url连接
 * @param {Object} fun 回调函数
 */
MusicVisualizer.prototype.load = function(url,fun){
	//在加载之前，终止之前的播放
	this.xhr.abort(); 
	
	//发起AJAX请求（GET请求）
	this.xhr.open("GET",url);
	//定义服务器端返回的数据类型，二进制缓冲区
	this.xhr.responseType = "arraybuffer";
	
	var self = this;
	this.xhr.onload = function(){
		fun(self.xhr.response);
	}
	
	//加载完之后重新播放,向服务端发起ajax请求
	this.xhr.send();
}

/**
 * 解码函数
 * @param {Object} arraybuffer 数据缓冲
 * @param {Object} fun 回调函数
 */
MusicVisualizer.prototype.decode = function(arraybuffer,fun){
	//数据解码
	MusicVisualizer.ac.decodeAudioData(arraybuffer,function(buffer){
		fun(buffer);
	},function(err){
		console.log(err);
	});
}

/**
 * 播放函数
 */
MusicVisualizer.prototype.play = function(url){
	//计数
	var n = ++this.count;
	var self = this;
	
	//播放之前做个判断，如果资源存在，就停止掉
	this.source && this.stop();
	
	/* 加载 */
	this.load(url,function(arraybuffer){
		//判断n,如果已经点击了,但是还未解码成功
		if(n != self.count){
			return;
		}
		
		/* 解码 */
		self.decode(arraybuffer,function(buffer){
			//判断n,如果已经点击了,但是还未解码成功
			if(n != self.count){
				return;
			}
			
			//使用上下文对象创建bufferSource对象
			var bs = MusicVisualizer.ac.createBufferSource();
			bs.buffer = buffer;
			
			//将bufferSource对象连接到analyser分析节点上
			bs.connect(self.analyser);
			
			//播放音频资源
			bs[bs.start ? "start" : "noteOn"](0);
			self.source = bs;
		});
	});
}

/**
 * 停止播放
 */
MusicVisualizer.prototype.stop = function(){
	this.source[this.source.stop ? "stop" : "noteOff"](0);
}

/**
 * 调节音量控制
 * @param {Object} precent
 */
MusicVisualizer.prototype.changeVolume = function(precent){
	this.gainNode.gain.value = precent * precent;
}

/**
 * 音乐数据可视化函数
 */
MusicVisualizer.prototype.visualize = function(){
	var arr = new Uint8Array(this.analyser.frequencyBinCount);
	
	/*此时这里只能输出一次，开始的时候输出了一次*/
	console.log(arr);
	
	//使用一个动画函数，使得可以持续的分析音频资源
	requestAnimationFrame = window.requestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							window.mozRequestAnimationFrame;
				
	var self = this;
	function v(){
		self.analyser.getByteFrequencyData(arr);
		
		//绘制图形（柱状图，圆点）
		self.drawGraph(arr);
		
		//动画函数
		requestAnimationFrame(v);
	}
	
	requestAnimationFrame(v);
}
