/**
 * Created by Administrator on 2015/10/9.ʹ�ô������
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
 ������
 </div>



 </body>
 </html>
 */
/**
 * ����Ҫ�Ĳ���
 * clickDom        ����ύ�İ�ť
 * action          �ύ��ҳ��
 * fileInputName   �ļ����������
 * onUploadSuccess  �����ص�����  ��Ȼ����ѡ�� ��ʵ������һ��Ҫ���
 * Ŀǰ����ѡ��Ĳ���
 * formData   ���ӵı�����
 * id  ����iframe��idǰ׺ Ȼ����
 * �����Ĳ�����û�����涨  �Ժ������� �����Ŵ�
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
    that.formData = typeof(options.formData == 'object')?options.formData:{};//�����ı�����
    that.action = options.action?options.action:'';
    that.id = options.id?options.id:'__imgUpload';
    that.fileInputName = options.fileInputName?options.fileInputName:'Filedata';

    that.iframeobj = null;//�ϴ��õĿ��
    that.form = null;
    that.iframeDoc = null;//����iframe��doc


    that.start = function(){

        that.createIframe();
        $(that.clickDom).click(function(){
            that.createInputFile();
            that.iframeobj.appendChild(that.inputFile);//��һ���ܹؼ� ie��֧�� û��append��ҳ���еĶ�����¼�����  google����
            $(that.inputFile).trigger("click");

        });
        //��������ҳ���ϴ����ļ� Ȼ��append��iframe��
    };
    //��inputfile ������ҳ  �����Ƿŵ� iframe��
    that.createInputFile = function(){
        that.iframeDoc =  that.iframeobj.contentDocument ? that.iframeobj.contentDocument : that.iframeobj.contentWindow.document;
        that.inputFile = that.iframeDoc.createElement("input");
        that.inputFile.type = "file";
        that.inputFile.name = that.fileInputName;
        //iframe���¼���֮�� ԭ���Ǹ�document�Ͳ����� ����Ҫ��ȡ�µ�document
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
        //����İ� �϶��ǵڶ��μ��ص�ʱ����¼���
        that.iframeobj.onload = function(){
            var str = that.iframeobj.contentWindow.document.body.innerHTML;
            var obj = JSON.parse(str);
            that.onUploadSuccess(obj);//�ص�����
        };
    };

    //iframeʵ����ˢ���ϴ�   С�ܻ��������õ���
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