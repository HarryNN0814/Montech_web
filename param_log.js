var bodyParamLog = "<div style=\"text-align:left;display:inline-block;min-width:260px;\">\
<h3 style=\"text-align: center;margin: 5px;margin-left: 0;padding-left: 3;\">{ten}</h3>\
<table border=\"0\" width=\"100%\" style=\"margin-bottom: -5px;\" id=\"TableInfo\" class=\"tableNoBorder\">\
    <tbody>\
    <tr>\
            <td style=\"text-align: left;padding-left: 0;\">Địa chỉ: {dia chi}</td>\
            <td></td>\
            <td style=\"text-align: right; padding-right: 0;\">20-01-2018 16:30:30</td>\
        </tr>\
    <tr>\
            <td></td>\
            <td></td>\
            <td style=\"text-align: right; color: #92D14F; padding:10; padding-top: 0;padding-right: 0;\"></td>\
        </tr>\
</tbody></table>\
<table border=\"0\" id=\"ControlTable\" width=\"100%\" style=\"margin-bottom: 0px;\" class=\"tableNoBorder\">\
    <tbody>\
    <tr>\
            <td style=\"text-align: left; color: #00B0F0; padding-left: 0\" onclick=\"downloadParamLog()\"><u><b>LỊCH SỬ CÀI ĐẶT</b></u></td>\
            <td></td>\
        </tr>\
</tbody></table>\
<div style=\"width:100%;overflow-x:scroll;\">\
<table border=\"1\" id=\"paramTable\" width=\"100%\">\
</table>\
</div>\
<p style=\"text-align: center;\"><font size=\"0\" face=\"arial\" color=\"gray\">\
Copyright © 2021 - Bản quyền thuộc về Công ty TNHH Kỹ Thuật Mon</font></p>\
</div>";

var myParamTableTh = "<tr>\
                    <th class=\"thcGray\">Thứ Tự</th>\
                    <th class=\"thcGray\" onclick=\"formatParamLog()\">Vòi Bơm</th>\
                    <th class=\"thcGray\">Ngày</th>\
                    <th class=\"thcGray\">Giờ</th>\
                    <th class=\"thcGray\">Thông Tin</th>\
                    <th class=\"thcGray\">Giá Trị</th>\
                    <th class=\"thcGray\">Nơi Thay Đổi</th>\
                    </tr>";

var myParamTableTd = "<tr>\
                    <td></td>\
                    <td></td>\
                    <td></td>\
                    <td></td>\
                    <td></td>\
                    <td></td>\
                    <td></td>\
                    </tr>";

var COST_TYPE = 10;
var ENCODER_TYPE = 43;
var POWER_TYPE = 33;

function typeOfParam(e) {
    var type;
    if (COST_TYPE == e) {
        type = "Giá";
    }
    if (ENCODER_TYPE == e) {
        type = "Encoder";
    }
    if (POWER_TYPE == e) {
        type = "Power";
    }
    return type;
}

var MAIN_SOURCE = 0;
var WEB_SOURCE = 1;

function sourceOfParam(e) {
    var source;
    if (MAIN_SOURCE == e) {
        source = "Bộ Số";
    }
    if (WEB_SOURCE == e) {
        source = "Web";
    }
    return source;
}

function createParamLogTable(e) {
    var obj = JSON.parse(e);
    var table = myParamTableTh;
    var row = obj.param_log.length;
    var i;

    for (i = 0; i < row; ++i) {
        var tdTable = myParamTableTd;
        table += tdTable;
    }
    document.getElementById('paramTable').innerHTML = table;

    var paramTable = document.getElementById("paramTable");
    for (i = 1; i <= row; ++i) {
        /* pump,date,time,type,value,source */
        var j = row - i;
        var type = obj.param_log[j][3];
        var value;
        if (COST_TYPE == type) {
            value = cash_format(obj.param_log[j][4] / 1000, "") + " Đ";
        }
        if (ENCODER_TYPE == type) {
            value = obj.param_log[j][4] + " Lần";
        }
        if (POWER_TYPE == type) {
            if (obj.param_log[j][4] == 1) {
                value = "OFF";
            }
            if (obj.param_log[j][4] == 0) {
                value = "ON";
            }
        }
        paramTable.rows[i].cells[1].innerHTML = obj.param_log[j][0];
        paramTable.rows[i].cells[2].innerHTML = date_num2str(obj.param_log[j][1]);
        paramTable.rows[i].cells[3].innerHTML = time_num2str(obj.param_log[j][2]);
        paramTable.rows[i].cells[4].innerHTML = typeOfParam(type);
        paramTable.rows[i].cells[5].innerHTML = value;
        paramTable.rows[i].cells[6].innerHTML = sourceOfParam(obj.param_log[j][5]);
    }
}

function loadParamLog() {
    client.get('/get?param_wifi=param_log', function(response) {
        console.log(response);
        createParamLogTable(response);
    });
}

function onBodyLoad() {
    client.get('/get?param_wifi=device_info', function(response) {
        console.log(response);
        var obj = JSON.parse(response);
        var device_name = obj.name;
        var device_addr = obj.addr;

        var BodyHtml = bodyParamLog;
        BodyHtml = BodyHtml.replace("{ten}", device_name);
        BodyHtml = BodyHtml.replace("{dia chi}", device_addr);
        BodyHtml = BodyHtml.replace("{ket noi}", "Chờ kết nối");
        BodyHtml = BodyHtml.replace("{color}", "blue");
        document.getElementById('bodyParam').innerHTML = BodyHtml;
        /* Must be call after generate body html*/
        display_time();
        connectionStatusHandler();
        loadParamLog();
    });
}

var connectionStatusTimeout = setTimeout(2000);
var connectionRetryCounter = 3;

function connectionStatusHandler() {
    var table = document.getElementById('TableInfo');
    client.get('/get?param_wifi=device_info', function(response) {
        console.log(response);
        connectionRetryCounter = 3;
        clearTimeout(connectionStatusTimeout);
        table.rows[1].cells[2].innerHTML = "Đang Kết Nối";
        table.rows[1].cells[2].style.color = "#92D14F";
        connectionStatusTimeout = setTimeout(connectionStatusHandler, 10000);
        return;
    });

    if (connectionRetryCounter > 0) {
        connectionRetryCounter--;
        connectionStatusTimeout = setTimeout(connectionStatusHandler, 2000);
    } else {
        table.rows[1].cells[2].innerHTML = "Đứt Kết Nối";
        table.rows[1].cells[2].style.color = "red";
    }
}

function downloadParamLog() {
    var answer = confirm("Xác Nhận Tải File Lịch Sử Cài Đặt");
    if (!answer) return;
    var fileday_format = get_ddmmyy_format() + get_hhmmss_format();
    var filename = fileday_format + "_lich_su_cai_dat.csv";
    var file_download = "param_setting.csv";
    window.open("/edit_sdfs?download=/" + file_download + "&filename=" + filename);
}

function formatParamLog() {
    var answer = confirm("Xác Nhận Xoá File Lịch Sử Cài Đặt");
    if (!answer) return;
    var fileDelete = "param_setting.csv";
    client.delect('/edit_sdfs', "path=/" + fileDelete, function(response) {
        console.log(response);
        alert("Xóa File Lịch Sử Cài Đặt OK");
    });
}