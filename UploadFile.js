/**
 * Created by Administrator on 2015/10/9.使用大概如下
 * <!DOCTYPE html>
 <html>
 <head>
 {gres:js jquery-1.11.2.min.js}
 {gres:js uploadFile/UploadFile.js}
 </head>
 <body>
 <script type="text/javascript">



 $(document).ready(function(){
        var ceshi = document.getElementById("ceshi");
        var upload = new Upload({
            "clickDom":ceshi,
            "formData":{"a":"haha","b":"hehe"},
            "action":"/media_article_ceshiupload",
            "onUploadSuccess":function(){}
        });
        upload.start();
    });

 </script>
 <div id="ceshi">
 点这里
 </div>



 </body>
 </html>
 */
/**
 * 必须要的参数
 * clickDom        点击提交的按钮
 * action          提交的页面
 * fileInputName   文件表单域的名字
 * onUploadSuccess  处理返回的数据  虽然这里选填 但实践中是一定要填的
 * 目前可以选填的参数
 * formData   附加的表单数据
 * id  内联iframe的id前缀 然并卵
 * 其他的参数还没有做规定  以后再完善 还有排错
 * @param options
 * @constructor
 */
var Upload = function(options){
    var that = this;
    that.clickDom = options.clickDom?options.clickDom:null;
    that.fileSizeLimit = options.fileSizeLimit?options.fileSizeLimit:"2MB";
    that.fileTypeExts = options.fileTypeExts?options.fileTypeExts:"*.gif; *.jpg; *.jpeg; *.png;";
    that.onUploadSuccess = typeof( options.onUploadSuccess == 'function' )?options.onUploadSuccess:function(){};
    that.onUploadError = typeof( options.onUploadError == 'function' )?options.onUploadError:function(){};
    that.formData = typeof(options.formData == 'object')?options.formData:{};//附带的表单数据
    that.action = options.action?options.action:'';
    that.id = options.id?options.id:'__imgUpload';
    that.fileInputName = options.fileInputName?options.fileInputName:'Filedata';

    that.iframeobj = null;//上传用的框架
    that.form = null;
    that.iframeDoc = null;//操作iframe的doc


    that.start = function(){

        that.createIframe();
        $(that.clickDom).click(function(){
            that.createInputFile();
            that.iframeobj.appendChild(that.inputFile);//这一步很关键 ie不支持 没有append到页面中的对象的事件触发  google可以
            $(that.inputFile).trigger("click");

        });
        //可以先在页面上传完文件 然后append到iframe中
    };
    //把inputfile 发到本页  而不是放到 iframe中
    that.createInputFile = function(){
        that.iframeDoc =  that.iframeobj.contentDocument ? that.iframeobj.contentDocument : that.iframeobj.contentWindow.document;
        that.inputFile = that.iframeDoc.createElement("input");
        that.inputFile.type = "file";
        that.inputFile.name = that.fileInputName;
        //iframe重新加载之后 原来那个document就不在了 所以要获取新的document
        that.iframeDoc.body.innerHTML = '';
        $(that.inputFile).on("change",function(){
            that.upload();
        });

    };
    that.upload = function(){
        var form = that.iframeDoc.createElement("form");
        form.enctype="multipart/form-data";
        form.encoding="multipart/form-data";
        form.action = that.action;
        form.method="post";
        $(form).append(that.inputFile);
        if(that.formData){
            for(var s in that.formData){
                var input = document.createElement("input");
                input.type = "text";
                input.name = s;
                input.value= that.formData[s];
                $(form).append(input);
            }
        }
        that.form = form;
        that.iframeDoc.body.appendChild(form);
        $(form).submit();
        //这里的绑定 肯定是第二次加载的时候的事件绑定
        that.iframeobj.onload = function(){
            var str = that.iframeobj.contentWindow.document.body.innerHTML;
            var obj = JSON.parse(str);
            that.onUploadSuccess(obj);//回调函数
        };
    };

    //iframe实现无刷新上传   小弟还是有作用的嘛
    that.createIframe = function(){

        if (jQuery.isEmptyObject(that.iframeobj)) {
            var iframe = document.createElement("iframe");
            iframe.setAttribute("id", that.id + "_upload_iframe");
            iframe.setAttribute("name", that.id + "_upload_iframe");
            iframe.setAttribute("width", "0");
            iframe.setAttribute("height", "0");
            iframe.setAttribute("border", "0");
            iframe.setAttribute("src", "javascript:false;");
            iframe.style.display = "none";
            that.iframeobj = iframe;

            document.body.appendChild(that.iframeobj);
            that.iframeDoc =  that.iframeobj.contentDocument ? that.iframeobj.contentDocument : that.iframeobj.contentWindow.document;
        }
    };


}