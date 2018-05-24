//字段优先级
const total=13,no=12, cancer=11, gene=10, antigen=9, nucleicAcidExchange=8, aminoAcidExchange=7, hlaAllele=6, length=5, peptide=4, adjuvant=3,journalRef=2,pmid=1,placeholder=0;
Search_rownum = 1;
var mainKey = '';
function Search_mainSearch() {
    var strkey = $("#Search_input_fuzzy").val();
    if(!(strkey == "" || strkey == null || strkey == undefined)){
        $.ajax( {
            url: "/Search/fuzzy_search_cancer.do",
            type: "POST",
            dataType: 'json',
            data:   {"key": strkey},
            success: function(data){
                mainKey = $("#Search_input_fuzzy").val();
                $("#Search_table tbody").html("");
                Search_SortData(data);
                Search_CreatTable(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

            }
        });
    }
}

function Similar(para1,para2) {
    str1=String(para1);
    str2=String(para2);
    var editDistance = function (str1,str2) {//获取编辑距离

        var lenStr1 = str1.length;
        var lenStr2 = str2.length;
        var temp; // 记录相同字符,在某个矩阵位置值的增量,不是0就是1
        if (lenStr1 == 0) {
            return lenStr2;
        }
        if (lenStr2 == 0) {
            return lenStr1;
        }
        //矩阵 (lenStr1+1)*(lenStr2+1)
        var matrix = new Array();
        //构建二维数组
        for (var i = 0; i <= lenStr1; i++) {
            matrix[i] = new Array();
        }

        for (var j=0; j<= lenStr2; j++){// 初始化编辑距离二维数组第一行
            matrix[0][j] = j;
        }

        for (var i = 0; i <= lenStr1; i++) { // 初始化编辑距离二维数组第一列
            matrix[i][0] = i;
        }

        for (var i = 1; i <= lenStr1; i++) { // 遍历str1
            var ch1 = str1.charAt(i - 1);
            // 去匹配str2
            for (j = 1; j <= lenStr2; j++) {
                var ch2 = str2.charAt(j - 1);
                temp= ch1.toLowerCase() == ch2.toLowerCase()?0:1;
                // if (ch1 == ch2) {
                //     temp = 0;
                // } else {
                //     temp = 1;
                // }
                // 左边+1,上边+1, 左上角+temp,取最小值
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + temp);
            }
        }
        return matrix[lenStr1][lenStr2];
    }

    var ed = editDistance(str1, str2);
    return 1 - ed / Math.max(str1.length, str2.length);
}

function Search_SortData(json_data) {
    for (var i in json_data) {//遍历一下json数据,加入相似度
        var similarArr = new Array(total);
        similarArr[placeholder]=0;
        similarArr[pmid]= Similar(json_data[i].pmid,mainKey);
        similarArr[journalRef]=Similar(json_data[i].journalRef,mainKey);
        similarArr[adjuvant]=Similar(json_data[i].adjuvant,mainKey);
        similarArr[peptide]=Similar(json_data[i].peptide,mainKey);
        similarArr[length]=Similar(json_data[i].length,mainKey);
        similarArr[hlaAllele]=Similar(json_data[i].hlaAllele,mainKey);
        similarArr[aminoAcidExchange]=Similar(json_data[i].aminoAcidExchange,mainKey);
        similarArr[nucleicAcidExchange]=Similar(json_data[i].nucleicAcidExchange,mainKey);
        similarArr[antigen]=Similar(json_data[i].antigen,mainKey);
        similarArr[gene]=Similar(json_data[i].gene,mainKey);
        similarArr[cancer]=Similar(json_data[i].cancer,mainKey);
        similarArr[no]=Similar(json_data[i].no,mainKey);
        var maxsimilar = Math.max.apply(Math, similarArr);
        var index = similarArr.indexOf(maxsimilar);
        json_data[i].maxsimilar = maxsimilar;
        json_data[i].SimilarIndex = index;
    }

    //根据相似度进行排序
    var desc = function(x,y){
        if (x.maxsimilar==y.maxsimilar){
            return y.SimilarIndex - x.SimilarIndex;
        }else {
            return y.maxsimilar-x.maxsimilar;
        }
    };
    json_data.sort(desc);
    // json_data.sort(function (x,y) {
    //     if (x.maxsimilar==y.maxsimilar){
    //         return y.SimilarIndex - x.SimilarIndex;
    //     }else {
    //         y.maxsimilar-x.maxsimilar;
    //     }
    // })
    return json_data;
}

function Search_CreatTable(json_data){

    var tbody = document.getElementById('tbMain');
    for (var i in json_data){//遍历一下json数据
        var trow = Search_getDataRow(json_data[i]); //定义一个方法,返回tr数据
        tbody.appendChild(trow);
    }
    //显示
    $(".Search_table_data").show();
    //如果需要分页就显示分页
    if (json_data.length > 20){
        $("#Search_jumpPagebar").show();
        layui.use(['laypage', 'layer'], function() {
            var laypage = layui.laypage
                , layer = layui.layer;
            laypage.render({
                elem: 'Search_jumpPagebar'
                ,count: json_data.length
                ,limit:20
                ,layout: ['count', 'prev', 'page', 'next', 'limit', 'skip']
                ,jump: function(obj){
                    var beginRow=(obj.curr-1)*obj.limit + 1;// 起始记录号
                    var endRow = beginRow + obj.limit - 1;    // 末尾记录号

                    $("#Search_table tr").hide();    // 首先，设置这行为隐藏
                    $("#Search_table tr").each(function(i){    // 然后，通过条件判断决定本行是否恢复显示
                        if((i>=beginRow && i<=endRow) || i==0 )//显示begin<=x<=end的记录
                            $(this).show();
                    });
                }
            });
        });
    }
    else{
        $("#Search_jumpPagebar").hide();
    }

}

function Search_getDataRow(rowData){
    var row = document.createElement('tr'); //创建行
    var AddRowFunc = function (ColumnName) {
        var idCell = document.createElement('td'); //创建第一列id
        //idCell.innerHTML = eval('rowData.'+ColumnName); //填充数据
        idCell.innerHTML = rowData[ColumnName]; //填充数据
        row.appendChild(idCell); //加入行
    }
    AddRowFunc('no');
    AddRowFunc('cancer');
    AddRowFunc('gene');
    AddRowFunc('antigen');
    AddRowFunc('nucleicAcidExchange');
    AddRowFunc('aminoAcidExchange');
    AddRowFunc('hlaAllele');
    AddRowFunc('length');
    AddRowFunc('peptide');
    AddRowFunc('adjuvant');
    AddRowFunc('journalRef');
    AddRowFunc('pmid');
    AddRowFunc('maxsimilar');
    AddRowFunc('SimilarIndex');
    return row; //返回tr数据
}
function  del(id) {
    $("#Search_row_"+id).remove();
}
function Search_AddRow() {
    var html_bar ="  <div id='Search_row_"+Search_rownum+"' >"+
        "                <div class=\"layui-inline Search_layui_inline_1\">"+
        "                    <form class=\"layui-form\" action=\"\">"+
        "                        <select name=\"Search_sel_Conjunction\" lay-verify=\"\" lay-search>"+
        "                            <option value=\"AND\" selected>AND</option>"+
        "                            <option value=\"OR\">OR</option>"+
        "                            <option value=\"NOT\">NOT</option>"+
        "                        </select>"+
        "                    </form>"+
        "                 </div>"+
        "                <div class=\"layui-inline Search_layui_inline_2\">"+
        "                    <form class=\"layui-form\" action=\"\">"+
        "                        <select name=\"Search_sel_Fields\" lay-verify=\"\" lay-search>"+
        "                            <option value=\"No\" selected>No</option>"+
        "                            <option value=\"Cancer\">Cancer</option>"+
        "                            <option value=\"Gene\">Gene</option>"+
        "                            <option value=\"Pmid\">Pmid</option>"+
        "                        </select>"+
        "                    </form>"+
        "                </div>"+
        "                <div class=\"layui-inline Search_layui_inline_3\">"+
        "                    <input type=\"text\" name=\"title\" required lay-verify=\"required\" placeholder=\"请输入标题\" autocomplete=\"off\" class=\"layui-input nput_exact_bar\">"+
        "                </div>"+
        "                <div class=\"layui-inline Search_layui_inline_4\">"+
        "                    <div class=\"layui-btn-group\">"+
        "                        <button onclick='del("+Search_rownum+")' class=\"layui-btn layui-btn-primary layui-btn-sm\" id='Search_btn_delrow_"+Search_rownum+"'\">"+
        "                            <i class=\"layui-icon\">&#xe640;</i>"+
        "                        </button>"+
        "                    </div>"+
        "                </div>"+
        "             </div>";

    $('#exactbar_contend').append(html_bar);

    // $("#Search_btn_delrow_"+Search_rownum).on("click",Search_rownum,function(id){
    //     $("#Search_row_"+id).remove();
    // })

    Search_rownum++;
    layui.use('form', function() {
        var form = layui.form; //只有执行了这一步，部分表单元素才会自动修饰成功
        form.render();
    });
}

function Search_ShowAdvanced() {
    $("#exactbar").show();
    $(".Search_table_data").hide();
    $("#Search_btn_fuzzy").attr("disabled","disabled");
    $("#Search_input_fuzzy").attr("disabled","disabled");
}

function Search_exactSearch() {
    //获取数据存入数组
    var GetDataFunc = function () {
        var data = new Array();
        var row=0,column=0;
        $("#exactbar_contend").children().each(function () {
            data[row] = new Array();
            column=0;
            $(this).each(function () {
                if ($(this).find("select[name='Search_sel_Conjunction']").val() != null){
                    data[row][column++]=$(this).find("select[name='Search_sel_Conjunction']").val();
                }
                data[row][column++]=$(this).find("select[name='Search_sel_Fields']").val();
                data[row][column++]=$(this).find("input[name='title']").val();
            });
            row++;
        });
        return data;
    }
    //根据数据拼写sql
    var ConvertData = function (data) {
        var bIsFuzzy = false;
        var sql;
        if (bIsFuzzy){//字段精确查询
            sql = "select * from cancerdb where " + data[0][0]+"="+"'"+data[0][1]+"'";
            for(var i in data) {
                if(i>0){
                    sql+=" "+data[i][0]+" "+data[i][1]+"="+"'"+data[i][2]+"'";
                }
            }
        }else{//字段模糊查询
            sql = "select * from cancerdb where " + data[0][0]+" like "+"'%"+data[0][1]+"%'";
            for(var i in data) {
                if(i>0){
                    sql+=" "+data[i][0]+" "+data[i][1]+" like "+"'%"+data[i][2]+"%'";
                }
            }
        }

        return sql;
    }

    var ajax = function (sql) {
        $.ajax( {
            url: "/Search/exact_search_cancer.do",
            type: "POST",
            dataType: 'json',
            data:   {"key": sql},
            success: function(data){
                $("#Search_div_table tbody").html("");
                Search_CreatTable(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
            }
        });
    }
    ajax(ConvertData(GetDataFunc()));
}

layui.use('form', function(){
    var form = layui.form;

    //监听提交
    form.on('submit(formDemo)', function(data){
        layer.msg(JSON.stringify(data.field));
        return false;
    });
});