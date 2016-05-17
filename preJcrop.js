/**
 * Created by Administrator on 2015/10/11.
 */

//jquery  jcrop 库支持
//裁剪插件封装
/**
 *
 * 注意 包裹that.containerBoxSelect 的外层div要设置成相对定位  这个是视觉上的预览框
 *
 * 必须参数
 * that.containerBoxSelect
 *   默认值是.target-container 操作的图片对象div包裹
 * target:'#target',
 *   要操作的图片对象的选择器 默认值#target
 preContainerSelect:[".preview-container",".preview-container-2",".preview-container-3"],
 //包裹预览图的div数组  默认值[".preview-container"]
 preImgSelect:["#pre-img","#pre-img-2","#pre-img-3"],
 //预览图数组 上面的参数对应  默认值 ["#pre-img"]
 ajaxCallback:function(data){
                //调用send方法后的回调函数
           console.log(data);}
 * 默认值 function(){}
 *
 * 可选
 * postUrl
 *   裁剪后台处理的路径
 * imgUrl
 *   图片路径 这个不传 可以自动获取
 * cutWidth
 * cutHeight
 *   后台要裁剪的大小
 * boxWidth
 * boxHeight
 *   画布最大的大小  最好不要大过那个视觉上的框  也就是包裹that.containerBoxSelect 的上一级div
 * constSelectbox
 *    选框大小
 *
 *
 */
//带有预览图的jcrop
var preJcrop = function(options){
    var that = this;

    //图片选择器
    that.target = options.target?options.target:'#target';  //必须参数 //要做选框的目标图片 img的id
    //画布
    that.boxWidth = options.boxWidth?options.boxWidth:700; //canvas画布的大小 这个画布是多大 图片就显示多大 它是平铺的 图片在画布的左上角 是按照图片的比例缩放成适合画布的最大尺寸
    that.boxHeight = options.boxHeight?options.boxHeight:500;
    //that.constBox = [300,100];//width height 画布最大尺寸      我去 居然忘记了   这个boxWidthboxHeight和constBox有影响吗  怎么影响 这玩意不是动态变化的吗 难道  之前用了这个值 初始化的时候用了 暂时不明白为何不能与boxWidth boxHeight
    that.constBox = [that.boxWidth,that.boxHeight];

    //选框
    that.constSelectBox = options.constSelectBox?options.constSelectBox:[215,126]//[215,126];//0 宽 1 高  选取框默认尺寸 选取框的尺寸是不变的  只不过根据图片的大小来计算选取框应该在什么位置
    //that.aspectRatio = options.aspectRatio?options.aspectRatio:215/126; //比例 选框宽高比。说明：width/height  //这个不用设置
    that.aspectRatio = that.constSelectBox[0]/that.constSelectBox[1];//用这个替代 选框比例



    //that.constBox = [215,126];
    //包裹被操作图片的div
    that.containerBoxSelect = options.containerBoxSelect?options.containerBoxSelect:'.target-container';//选择器 包裹图片的div  用这个包裹那个图片 然后定位这div使它居中

    //包裹预览图片的div 和预览图片   预览图片的最好是一个数组 这样可以填加更多的预览图   //这里都变成数组
    /*that.preContainerSelect = options.preContainerSelect?options.preContainerSelect:'preview-container';
     that.preImgSelect = options.preImgSelect?options.preImgSelect:'.preview-container img';
     that.preContainer = $(that.preContainerSelect);
     that.preImg = $(that.preImgSelect); //预览图片
     that.xsize = that.preContainer.width();  //预览图片的容器大小
     that.ysize = that.preContainer.height();*/


    that.preContainerSelect = options.preContainerSelect?options.preContainerSelect:['preview-container'];
    that.preImgSelect = options.preImgSelect?options.preImgSelect:['.preview-container img'];
    that.preContainer = [];//预览图片的包裹div
    that.preImg = [];//预览图片
    that.xsize = []; //预览图片的容器大小
    that.ysize = [];
    for(var i = 0; i< that.preContainerSelect.length; i++ ){
        that.preContainer.push($(that.preContainerSelect[i]));
    }
    for(var i = 0; i< that.preImgSelect.length; i++ ){
        that.preImg.push($(that.preImgSelect[i]));
    }
    for(var i = 0; i< that.preContainer.length; i++  ){
        that.xsize.push( that.preContainer[i].width());
        that.ysize.push( that.preContainer[i].height());
    }



    //传入后台裁剪的大小
    that.cutWidth = options.cutWidth?options.cutWidth:'215'; // '215'; 要裁剪成的大小
    that.cutheight = options.cutHeight?options.cutHeight:'126'; // '126';
    that.ajaxCallback = (typeof options.ajaxCallback == 'function')?options.ajaxCallback:function(){};
    that.imgUrl = options.imgUrl?options.imgUrl:'';

    //可以自动获取
    //图片的大小
    that.imgWidth = options.imgWidth?options.imgWidth:0;
    that.imgHeight = options.imgHeight?options.imgHeight:0;
    //api对象
    that.jcrop_api = null;
    //图片在操作框中的缩放比例
    that.rate = 0;//图片的缩放比率

    that.sendMsg = {};//最终发送到后台的数据
    that.postUrl = options.postUrl?options.postUrl:'/image_upload_newcrop';
    that.started = false;//检测是否已经调用start函数  比如在调用send方法的时候 判断是否已经有数据了  如果都还没有调用start函数 调用send函数没有意义

    //{param.height,param.width}
    //计算画布的大小  画布有一个最大尺寸  为何要计算画布大小 因为控制图片的位置 是很难控制的 所以采用在一个div中定位这个画布的位置来
    //完成 图片在显示框中的假象  其实是一个画布在一个框中 根据图片的大小来计算和定位 看起来就是图片居中适配了
    that.calCanvasSize = function(){
        //图片原始高宽
        var height = that.imgHeight;
        var width = that.imgWidth;
        //设置boxWidth boxHeight  图片比较小的情况下 box的宽高与 图片一样
        if(height < that.constBox[1] && width < that.constBox[0]){
            that.boxHeight = height;
            that.boxWidth = width;
            that.rate = 1;
        }else{//如果图片比预定的框还要大  看看图片的高宽比 决定按照高度还是按照 宽度设置成百分百宽
            var constRate = that.constBox[1]/that.constBox[0];
            var hw = height/width;
            if(hw > constRate){//高的占比大 高设置成百分百  宽随百分比调整
                that.rate = that.constBox[1] / height; console.log('rate:'+that.rate);
                that.boxHeight = that.constBox[1];
                that.boxWidth = width * that.rate;
            }else{
                that.rate = that.constBox[0] / width;console.log('rate:'+that.rate);
                that.boxWidth = that.constBox[0];
                that.boxHeight = height * that.rate;
            }
        }
    }


    //计算选框的位置  参数是全局变量  这个函数只能在计算了选框之后使用  选取框最大是规定的大  小于设置的就是图片最大的
    that.calSelectBoxPos = function(){
        //计算选择框的适配  三种情况  1：图片有足够的空间容纳 选框  2：依照高或者宽 取大值
        //找到中点
        var selectBox = [];
        var middlePoint = [ that.boxWidth /2 , that.boxHeight/2 ]; //图片的中点

        if(that.boxWidth > that.constSelectBox[0] && that.boxHeight > that.constSelectBox[1] ){
            selectBox = that.constSelectBox;
        }else{
            //计算图片高宽比与选框的高宽比
            if( that.boxHeight/that.boxWidth > that.constSelectBox[1]/that.constSelectBox[0]){//图片高过量 设置选框宽为慢屏
                selectBox[0] = that.boxWidth;
                selectBox[1] = that.constSelectBox[1]/that.constSelectBox[0]*selectBox[0];
            }else{
                selectBox[1] = that.boxHeight;
                selectBox[0] = that.constSelectBox[0]/that.constSelectBox[1]*selectBox[1];
            }
        }
        var halfSelect = [selectBox[0]/2,selectBox[1]/2];  //选取框的一半
        return [middlePoint[0]-halfSelect[0],middlePoint[1]-halfSelect[1],middlePoint[0]+halfSelect[0],middlePoint[1]+halfSelect[1]];//选取框的两个点 左上角  右下角
    }


    //设置画布大小 位置  选框位置
    that.setCanvasBox = function(animateToBox){
        var that = this;
        that.jcrop_api.setOptions({boxWidth:that.boxWidth,boxHeight:that.boxHeight});
        //这个animateToBox的值 是按照像素的大小来的  所以要乘以缩放的比例
        for(var i = 0;i<4;i++){
            animateToBox[i] = animateToBox[i]/that.rate;
        }
        if(animateToBox) {
            that.jcrop_api.animateTo(animateToBox);
        }
        $(that.containerBoxSelect).css({
            "border":"1px solid red",
            "width":that.boxWidth,
            "position":"absolute",
            "left":"50%",
            "top":"50%",
            "margin-left":-that.boxWidth/2+'px',
            "margin-top":-that.boxHeight/2+'px'
        });

    }

    //不知为何这个getBounds不能获取图像尺寸 所以传递进来先
    that.setImage = function(imgUrl,width,height){
        that.jcrop_api.setImage(imgUrl);
        //var bounds = that.jcrop_api.getBounds();//获取实际图像的尺寸
        ///boundw = bounds[0];boundh = bounds[1];
        //that.imgWidth = bounds[0];
        //that.imgHeight = bounds[1];
        that.imgWidth = width;
        that.imgHeight = height;
        console.log(that.imgWidth+":"+that.imgHeight);
        that.calCanvasSize();
        var animateToBox = that.calSelectBoxPos();
        that.setCanvasBox(animateToBox);
    }

    that.start = function(){
        //var data;
        //调用裁剪对象
        $(that.target).Jcrop({
            boxWidth:that.boxWidth,
            boxHeight:that.boxHeight,
            onChange: updatePreview,
            onSelect: updatePreview,
            aspectRatio: that.aspectRatio
        },function(){
            that.started = true;
            var bounds = this.getBounds();//获取实际图像的尺寸
            boundw = bounds[0];boundh = bounds[1];
            that.imgWidth = bounds[0];
            that.imgHeight = bounds[1];
            that.jcrop_api = this;//保存api
            that.calCanvasSize();
            var animateToBox = that.calSelectBoxPos();
            that.setCanvasBox(animateToBox);
            // Move the preview into the jcrop container for css positioning
            //$preview.appendTo(jcrop_api.ui.holder);
        });

        //更新预览图
        function updatePreview(c){
            that.jcrop_api = this;
            var bounds = that.jcrop_api.getBounds();

            that.sendMsg.x = c.x;
            that.sendMsg.y = c.y;
            that.sendMsg.x2 = c.x2;
            that.sendMsg.y2 = c.y2;
            that.sendMsg.w = bounds[0];
            that.sendMsg.h = bounds[1];
            that.sendMsg._w = that.cutWidth;// '215';
            that.sendMsg._h = that.cutheight;//'126';


            if (parseInt(c.w) > 0) {
                //计算横向放大 和纵向放大
                var rx = bounds[0] / c.w;                 //横向  缩小的倍数
                var ry = bounds[1] / c.h;                  //纵向  缩小的倍数

                //图片相对于选取框 放大多少倍  那么预览图就要相当于 预览框放大多少倍
                //坐标的放大倍数呢 就是 选取框到预览框放大的倍数
                for(var i = 0; i< that.preImg.length; i++ ){
                    that.preImg[i].css({
                        width: Math.round(that.xsize[i] * rx) + 'px',//图片应该放大的倍数
                        height: Math.round(that.ysize[i] * ry ) + 'px',
                        //that.constSelectBox;
                        marginLeft: '-' + Math.round((that.xsize[i]/ c.w) *  c.x) + 'px',
                        marginTop: '-' + Math.round((that.ysize[i]/ c.h) * c.y) + 'px'
                    });
                }

            }

        };
    }

    //发送信息到后台的函数
    that.send = function(){
        if(!that.started) return;
        if(that.imgUrl == ''){
            that.imgUrl = $(that.target).attr('src');
        }
        var data = {
            x:that.sendMsg.x,
            y:that.sendMsg.y,
            x2:that.sendMsg.x2,
            y2:that.sendMsg.y2,
            w:that.sendMsg.w,
            h:that.sendMsg.h,
            _w:that.sendMsg._w,
            _h:that.sendMsg._h,
            //imgUrl:$imgUrl.val()
            imgUrl:that.imgUrl
        };
        $.post(that.postUrl,data,function(data,status){
            that.ajaxCallback(data);
            //data = JSON.parse(data);
            //$("#logo_img").attr('src',data.url);
            //$("#logo").val(data.oriurl);
            //cancel();
        });
    }
	//补充注释 这里发送的数据是 按照显示给用户的大小来计算的  而不是相对于原图  

}