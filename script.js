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

    let allowableError = 0;
    let errorMessage = '';
    let documentError = '';
    let isRelativeError = false; // 默认是绝对误差

    // 根据选择的项目和在线测量平均值判断误差标准
    if (project === 'so2') {
        if (onlineAverage >= 715) {
            allowableError = 0.15 * onlineAverage; // 15%误差
            isRelativeError = true; // 相对误差
            errorMessage = '二氧化硫 浓度≥715mg/m³';
            documentError = '相对误差≤15%';
        } else if (onlineAverage >= 143 && onlineAverage < 715) {
            allowableError = 57; // 绝对误差±57mg/m³
            errorMessage = '二氧化硫 143mg/m³ ≤ 浓度 < 715mg/m³';
            documentError = '绝对误差≤±57mg/m³';
        } else if (onlineAverage >= 57 && onlineAverage < 143) {
            allowableError = 0.30 * onlineAverage; // 30%相对误差
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
            allowableError = 0.15 * onlineAverage; // 15%误差
            isRelativeError = true; // 相对误差
            errorMessage = '氮氧化物 浓度≥513mg/m³';
            documentError = '相对误差≤15%';
        } else if (onlineAverage >= 103 && onlineAverage < 513) {
            allowableError = 41; // 绝对误差±41mg/m³
            errorMessage = '氮氧化物 103mg/m³ ≤ 浓度 < 513mg/m³';
            documentError = '绝对误差≤±41mg/m³';
        } else if (onlineAverage >= 41 && onlineAverage < 103) {
            allowableError = 0.30 * onlineAverage; // 30%相对误差
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
            allowableError = 0.10 * onlineAverage; // 相对误差±10%
            isRelativeError = true;
            errorMessage = '烟气流速 > 10m/s';
            documentError = '相对误差≤10%';
        } else {
            allowableError = 0.12 * onlineAverage; // 相对误差±12%
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
            allowableError = 0.15 * onlineAverage; // 相对误差±15%
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
            allowableError = 0.25 * onlineAverage; // 相对误差±25%
            isRelativeError = true;
            errorMessage = '含湿量 > 5%';
            documentError = '相对误差≤25%';
        } else {
            allowableError = 0.015 * onlineAverage; // 绝对误差±1.5%
            errorMessage = '含湿量 ≤ 5%';
            documentError = '绝对误差≤±1.5%';
        }
    } else if (project === 'particles') {
        if (onlineAverage >= 200) {
            allowableError = 0.15 * onlineAverage; // 相对误差±15%
            isRelativeError = true;
            errorMessage = '颗粒物 浓度≥200mg/m³';
            documentError = '相对误差≤15%';
        } else if (onlineAverage >= 100 && onlineAverage < 200) {
            allowableError = 2; // 绝对误差±2mg/m³
            errorMessage = '颗粒物 100mg/m³ ≤ 浓度 < 200mg/m³';
            documentError = '绝对误差≤±2mg/m³';
        } else if (onlineAverage >= 50 && onlineAverage < 100) {
            allowableError = 0.25 * onlineAverage; // 相对误差±25%
            isRelativeError = true;
            errorMessage = '颗粒物 50mg/m³ ≤ 浓度 < 100mg/m³';
            documentError = '相对误差≤25%';
        } else if (onlineAverage >= 20 && onlineAverage < 50) {
            allowableError = 0.30 * onlineAverage; // 相对误差±30%
            isRelativeError = true;
            errorMessage = '颗粒物 20mg/m³ ≤ 浓度 < 50mg/m³';
            documentError = '相对误差≤30%';
        } else if (onlineAverage < 20) {
            allowableError = 6; // 绝对误差±6mg/m³
            errorMessage = '颗粒物 浓度 < 20mg/m³';
            documentError = '绝对误差≤±6mg/m³';
        }
    } else if (project === 'other_gas') {
        allowableError = 0.15 * onlineAverage; // 其它气态污染物，相对误差±15%
        isRelativeError = true;
        errorMessage = '其它气态污染物';
        documentError = '相对误差≤15%';
    }

    // 计算误差
    const error = Math.abs(onlineAverage - personalMeasurement);

    const resultElement = document.getElementById('result');

    // 显示详细结果，精确到小数点后五位
    let output = `
        <strong>结果详情：</strong><br>
        在线测量平均值: ${onlineAverage.toFixed(5)}<br>
        本人测量值: ${personalMeasurement.toFixed(5)}<br>
        文档要求的误差: ${documentError}<br>
        标准误差: ${allowableError.toFixed(5)}<br>
        现在的误差: ${error.toFixed(5)}<br>
        测量类别: ${errorMessage}<br>
    `;

    if (error <= allowableError) {
        output += `<span style="color: green;">合格</span>`;
    } else {
        output += `<span style="color: red;">不合格</span>`;
    }

    resultElement.innerHTML = output;
});
