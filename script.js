// 获取输入框和表单元素
const inputs = [
    document.getElementById('online1'),
    document.getElementById('online2'),
    document.getElementById('online3'),
    document.getElementById('online4'),
    document.getElementById('online5'),
    document.getElementById('personal')
];

// 添加项目切换事件监听
document.getElementById('project').addEventListener('change', function() {
    // 清空所有输入框的值
    inputs.forEach(input => {
        input.value = '';
    });

    // 清空结果显示
    document.getElementById('result').innerHTML = '';
});

document.getElementById('measurementForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // 获取用户输入的数值
    const onlineMeasurements = [
        parseFloat(document.getElementById('online1').value),
        parseFloat(document.getElementById('online2').value),
        parseFloat(document.getElementById('online3').value),
        parseFloat(document.getElementById('online4').value),
        parseFloat(document.getElementById('online5').value),
    ];
    const personalMeasurement = parseFloat(document.getElementById('personal').value);
    const project = document.getElementById('project').value;

    // 计算在线测量的平均值
    const onlineAverage = onlineMeasurements.reduce((acc, val) => acc + val, 0) / onlineMeasurements.length;

    let allowableErrorPercentage = 0; // 用于相对误差的百分比标准
    let allowableError = 0;
    let errorMessage = '';
    let documentError = '';
    let isRelativeError = false; // 默认是绝对误差

    // 根据选择的项目和在线测量平均值判断误差标准
    if (project === 'so2') {
        if (onlineAverage >= 715) {
            allowableErrorPercentage = 15; // 相对误差15%
            isRelativeError = true;
            errorMessage = '二氧化硫 浓度≥715mg/m³';
            documentError = '相对误差≤15%';
        } else if (onlineAverage >= 143 && onlineAverage < 715) {
            allowableError = 57; // 绝对误差±57mg/m³
            errorMessage = '二氧化硫 143mg/m³ ≤ 浓度 < 715mg/m³';
            documentError = '绝对误差≤±57mg/m³';
        } else if (onlineAverage >= 57 && onlineAverage < 143) {
            allowableErrorPercentage = 30; // 相对误差30%
            isRelativeError = true;
            errorMessage = '二氧化硫 57mg/m³ ≤ 浓度 < 143mg/m³';
            documentError = '相对误差≤±30%';
        } else if (onlineAverage < 57) {
            allowableError = 17; // 绝对误差±17mg/m³
            errorMessage = '二氧化硫 浓度 < 57mg/m³';
            documentError = '绝对误差≤±17mg/m³';
        }
    } else if (project === 'no2') {
        if (onlineAverage >= 513) {
            allowableErrorPercentage = 15; // 相对误差15%
            isRelativeError = true;
            errorMessage = '氮氧化物 浓度≥513mg/m³';
            documentError = '相对误差≤15%';
        } else if (onlineAverage >= 103 && onlineAverage < 513) {
            allowableError = 41; // 绝对误差±41mg/m³
            errorMessage = '氮氧化物 103mg/m³ ≤ 浓度 < 513mg/m³';
            documentError = '绝对误差≤±41mg/m³';
        } else if (onlineAverage >= 41 && onlineAverage < 103) {
            allowableErrorPercentage = 30; // 相对误差30%
            isRelativeError = true;
            errorMessage = '氮氧化物 41mg/m³ ≤ 浓度 < 103mg/m³';
            documentError = '相对误差≤±30%';
        } else if (onlineAverage < 41) {
            allowableError = 12; // 绝对误差±12mg/m³
            errorMessage = '氮氧化物 浓度 < 41mg/m³';
            documentError = '绝对误差≤±12mg/m³';
        }
    } else if (project === 'flow_rate') {
        if (onlineAverage > 10) {
            allowableErrorPercentage = 10; // 相对误差10%
            isRelativeError = true;
            errorMessage = '烟气流速 > 10m/s';
            documentError = '相对误差≤10%';
        } else {
            allowableErrorPercentage = 12; // 相对误差12%
            isRelativeError = true;
            errorMessage = '烟气流速 ≤ 10m/s';
            documentError = '相对误差≤12%';
        }
    } else if (project === 'temperature') {
        allowableError = 3; // 绝对误差±3°C
        errorMessage = '烟气温度';
        documentError = '绝对误差≤±3°C';
    } else if (project === 'oxygen') {
        if (onlineAverage > 5.0) {
            allowableErrorPercentage = 15; // 相对误差15%
            isRelativeError = true;
            errorMessage = '含氧量 > 5%';
            documentError = '相对误差≤15%';
        } else {
            allowableError = 1.0; // 绝对误差±1.0%
            errorMessage = '含氧量 ≤ 5%';
            documentError = '绝对误差≤±1.0%';
        }
    } else if (project === 'humidity') {
        if (onlineAverage > 5.0) {
            allowableErrorPercentage = 25; // 相对误差25%
            isRelativeError = true;
            errorMessage = '含湿量 > 5%';
            documentError = '相对误差≤25%';
        } else {
            allowableErrorPercentage = 1.5; // 相对误差1.5%
            isRelativeError = true;
            errorMessage = '含湿量 ≤ 5%';
            documentError = '相对误差≤±1.5%';
        }
    } else if (project === 'particles') {
        if (onlineAverage >= 200) {
            allowableErrorPercentage = 15; // 相对误差15%
            isRelativeError = true;
            errorMessage = '颗粒物 浓度≥200mg/m³';
            documentError = '相对误差≤15%';
        } else if (onlineAverage >= 100 && onlineAverage < 200) {
            allowableError = 2; // 绝对误差±2mg/m³
            errorMessage = '颗粒物 100mg/m³ ≤ 浓度 < 200mg/m³';
            documentError = '绝对误差≤±2mg/m³';
        } else if (onlineAverage >= 50 && onlineAverage < 100) {
            allowableErrorPercentage = 25; // 相对误差25%
            isRelativeError = true;
            errorMessage = '颗粒物 50mg/m³ ≤ 浓度 < 100mg/m³';
            documentError = '相对误差≤25%';
        } else if (onlineAverage >= 20 && onlineAverage < 50) {
            allowableErrorPercentage = 30; // 相对误差30%
            isRelativeError = true;
            errorMessage = '颗粒物 20mg/m³ ≤ 浓度 < 50mg/m³';
            documentError = '相对误差≤30%';
        } else if (onlineAverage < 20) {
            allowableError = 6; // 绝对误差±6mg/m³
            errorMessage = '颗粒物 浓度 < 20mg/m³';
            documentError = '绝对误差≤±6mg/m³';
        }
    } else if (project === 'other_gas') {
        allowableErrorPercentage = 15; // 相对误差15%
        isRelativeError = true;
        errorMessage = '其它气态污染物';
        documentError = '相对误差≤15%';
    }


// 计算误差
    let error = 0;
    if (isRelativeError) {
        error = Math.abs((onlineAverage - personalMeasurement) / personalMeasurement) * 100; // 相对误差，单位为百分比
    } else {
        error = Math.abs(onlineAverage - personalMeasurement); // 绝对误差
    }

    // 输出结果处理
    const resultElement = document.getElementById('result');
    let output = `
        <strong>结果详情：</strong><br>
        在线测量平均值: ${onlineAverage.toFixed(5)}<br>
        本人测量值: ${personalMeasurement.toFixed(5)}<br>
        文档要求的误差: ${documentError}<br>
        标准误差: ${isRelativeError ? allowableErrorPercentage + '%' : allowableError.toFixed(5)}<br>
        现在的误差: ${isRelativeError ? error.toFixed(1) + '%' : error.toFixed(5)}<br>
        测量类别: ${errorMessage}<br>
        误差类型: ${isRelativeError ? '相对误差' : '绝对误差'}<br>
    `;

    // 判断是否合格
    if (isRelativeError) {
        if (error <= allowableErrorPercentage) {
            output += `<span style="color: green;">合格</span>`;
        } else {
            output += `<span style="color: red;">不合格</span>`;
        }
    } else {
        if (error <= allowableError) {
            output += `<span style="color: green;">合格</span>`;
        } else {
            output += `<span style="color: red;">不合格</span>`;
        }
    }

    // 显示结果
    resultElement.innerHTML = output;
});
