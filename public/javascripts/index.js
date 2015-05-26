function $(s){
	return document.querySelectorAll(s);
}

var list = $("#list li");
var list_length = list.length;
var size = 128;

//将音频资源进行可视化制作，取得盒子div(放置柱状图)
var box = $("#box")[0];
var height,width;

//定义一个canvas画布元素
var canvas = document.createElement('canvas');
//将画布canvas添加到div展示区中
box.appendChild(canvas);

//获取ctx上下文对象,(2D图形)
var ctx = canvas.getContext("2d");

//点的集合数组
var Dots = [];
//定义一个线性渐变,纵向
var line;
//定义一个圆形渐变
var g;

//为drawGraph函数绑定一个属性（是画柱状图还是圆点）,默认是画柱状图
drawGraph.type = "column";
//获取可视化显示的类型
var types = $("#type li");

//获取MusicVisualizer实例
var mv = new MusicVisualizer({
	size:size,
	drawGraph:drawGraph
});

for(var i = 0;i< list_length;i++){
	list[i].onclick = function(){
		for(var j = 0;j < list_length;j++){
			list[j].className = "";
		}
		this.className = "selected";
		
		//load("/media/"+this.title);
		mv.play("/media/"+this.title);
	}
}

/**
 * 产生一个m-n之间的一个整数
 * @param {Object} m
 * @param {Object} n
 */
function random(m,n){
	return Math.round(Math.random()*(n - m) + m);
}

/**
 * 根据音频数据生成圆点
 */
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

/**
 * 鼠标点击的时候，改变显示效果
 */
for(var i = 0; i < types.length; i++){
	types[i].onclick = function(){
		for(var j = 0; j < types.length; j++){
			types[j].className = "";
		}
		//class属性变更
		this.className = "selected";
		
		//获取类型
		drawGraph.type = this.getAttribute("data-type");
	}
}

//为音量按钮绑定改变事件
$("#volume")[0].onchange = function(){
	mv.changeVolume(this.value/this.max);
}

//页面一加载，就调用一下改变音量的事件，使得默认的60生效
$("#volume")[0].onchange();
