

document.addEventListener('DOMContentLoaded', function() {

    // --- DOM 元素获取 ---
    const projectSelect = document.getElementById('project');
    const comparisonToolDiv = document.getElementById('comparisonTool');
    const conversionToolDiv = document.getElementById('conversionTool');

    // 比对工具的表单和结果
    const measurementForm = document.getElementById('measurementForm');
    const comparisonResultEl = document.getElementById('comparisonResult');

    // 约分计算器的表单和结果
    const roundingForm = document.getElementById('roundingForm');
    const roundingInput = document.getElementById('roundingInput');
    const roundingResultEl = document.getElementById('roundingResult');

    // 烟气折算计算器的表单和结果
    const noxConversionForm = document.getElementById('noxConversionForm');
    const standardOxygenInput = document.getElementById('standardOxygen');
    const measuredOxygenInput = document.getElementById('measuredOxygen');
    const measuredValueInput = document.getElementById('measuredValue');
    const noxResultEl = document.getElementById('noxResult');

    // --- 核心功能：切换工具界面 ---
    projectSelect.addEventListener('change', function() {
        // 清空所有结果显示
        comparisonResultEl.innerHTML = '';
        roundingResultEl.innerHTML = '';
        noxResultEl.innerHTML = '';

        // 清空输入框内容
        const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
        inputs.forEach(input => input.value = '');

        if (projectSelect.value === 'conversion') {
            comparisonToolDiv.style.display = 'none';
            conversionToolDiv.style.display = 'block';
        } else {
            comparisonToolDiv.style.display = 'block';
            conversionToolDiv.style.display = 'none';
        }
    });


    // --- 计算器一：烟气折算 (批量处理版) ---
    noxConversionForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. 获取输入值
        const stdO2 = parseFloat(standardOxygenInput.value);

        const meaO2Array = measuredOxygenInput.value.split('/')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(parseFloat);

        const meaValArray = measuredValueInput.value.split('/')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(parseFloat);

        // 2. 输入验证
        if (isNaN(stdO2)) {
            noxResultEl.innerHTML = `<span style="color: red;">请输入有效的“基准氧含量”！</span>`;
            return;
        }

        if (meaO2Array.length === 0 || meaValArray.length === 0) {
            noxResultEl.innerHTML = `<span style="color: red;">“实测氧含量”和“实测数值”不能为空！</span>`;
            return;
        }

        if (meaO2Array.length !== meaValArray.length) {
            noxResultEl.innerHTML = `<span style="color: red;">错误：“实测氧含量”的个数 (${meaO2Array.length}) 与 “实测数值”的个数 (${meaValArray.length}) 必须一一对应！</span>`;
            return;
        }

        if (meaO2Array.some(isNaN) || meaValArray.some(isNaN)) {
            noxResultEl.innerHTML = `<span style="color: red;">错误：请确保所有输入的数值都是有效的数字，并用'/'隔开。</span>`;
            return;
        }

        // 3. 循环计算并格式化输出
        let outputHtml = '<strong>批量计算结果：</strong><br><ol style="text-align: left; margin-top: 10px;">';
        let hasError = false;

        for (let i = 0; i < meaO2Array.length; i++) {
            const currentMeaO2 = meaO2Array[i];
            const currentMeaVal = meaValArray[i];

            if (21 - currentMeaO2 === 0) {
                outputHtml += `<li>第 ${i + 1} 组计算: <span style="color: red;">错误！实测氧含量不能为21。</span></li>`;
                hasError = true;
                continue;
            }

            const result = (21 - stdO2) / (21 - currentMeaO2) * currentMeaVal;

            // [修改] 只输出结果，不显示计算过程
            outputHtml += `<li>第 ${i + 1} 组结果: <strong style="color: #0056b3;">${result.toFixed(5)}</strong></li>`;
        }

        outputHtml += '</ol>';

        if (hasError) {
             outputHtml += '<p style="color:red; font-size: 14px; text-align: center;">已跳过计算中出错的项目。</p>';
        }

        noxResultEl.innerHTML = outputHtml;
    });


    // --- 计算器二：约分计算 (四舍六入五成双) ---
    function roundHalfToEven(value) {
        const decimal = value % 1;
        if (Math.abs(decimal) === 0.5) {
            const integerPart = Math.floor(Math.abs(value));
            if (integerPart % 2 === 0) {
                return Math.trunc(value);
            } else {
                return Math.round(value);
            }
        }
        return Math.round(value);
    }

    roundingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = parseFloat(roundingInput.value);
        if (isNaN(value)) {
            roundingResultEl.innerHTML = `<span style="color: red;">请输入一个有效的数字！</span>`;
            return;
        }
        const result = roundHalfToEven(value);
        roundingResultEl.innerHTML = `
            输入值: ${value}<br>
            <strong>修约后结果: ${result}</strong>
        `;
    });


    // --- 原有的测量比对工具逻辑 ---
    measurementForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const onlineMeasurements = [
            parseFloat(document.getElementById('online1').value),
            parseFloat(document.getElementById('online2').value),
            parseFloat(document.getElementById('online3').value),
            parseFloat(document.getElementById('online4').value),
            parseFloat(document.getElementById('online5').value),
        ];
        const personalMeasurement = parseFloat(document.getElementById('personal').value);
        const project = projectSelect.value;

        if (onlineMeasurements.some(isNaN) || isNaN(personalMeasurement)) {
            comparisonResultEl.innerHTML = `<span style="color: red;">请输入所有必需的测量值！</span>`;
            return;
        }

        const onlineAverage = onlineMeasurements.reduce((acc, val) => acc + val, 0) / onlineMeasurements.length;

        let allowableErrorPercentage = 0, allowableError = 0;
        let errorMessage = '', documentError = '';
        let isRelativeError = false;

        // ... (此处为完整的if-else判断逻辑，与您原始代码相同，无需修改)
        if (project === 'so2') {
            if (onlineAverage >= 715) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '二氧化硫 浓度≥715mg/m³'; documentError = '相对误差≤15%'; } 
            else if (onlineAverage >= 143) { allowableError = 57; errorMessage = '二氧化硫 143mg/m³ ≤ 浓度 < 715mg/m³'; documentError = '绝对误差≤±57mg/m³'; } 
            else if (onlineAverage >= 57) { allowableErrorPercentage = 30; isRelativeError = true; errorMessage = '二氧化硫 57mg/m³ ≤ 浓度 < 143mg/m³'; documentError = '相对误差≤±30%'; } 
            else { allowableError = 17; errorMessage = '二氧化硫 浓度 < 57mg/m³'; documentError = '绝对误差≤±17mg/m³'; }
        } else if (project === 'no2') {
            if (onlineAverage >= 513) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '氮氧化物 浓度≥513mg/m³'; documentError = '相对误差≤15%'; } 
            else if (onlineAverage >= 103) { allowableError = 41; errorMessage = '氮氧化物 103mg/m³ ≤ 浓度 < 513mg/m³'; documentError = '绝对误差≤±41mg/m³'; } 
            else if (onlineAverage >= 41) { allowableErrorPercentage = 30; isRelativeError = true; errorMessage = '氮氧化物 41mg/m³ ≤ 浓度 < 103mg/m³'; documentError = '相对误差≤±30%'; } 
            else { allowableError = 12; errorMessage = '氮氧化物 浓度 < 41mg/m³'; documentError = '绝对误差≤±12mg/m³'; }
        } else if (project === 'flow_rate') {
            if (onlineAverage > 10) { allowableErrorPercentage = 10; isRelativeError = true; errorMessage = '烟气流速 > 10m/s'; documentError = '相对误差≤10%'; } 
            else { allowableErrorPercentage = 12; isRelativeError = true; errorMessage = '烟气流速 ≤ 10m/s'; documentError = '相对误差≤12%'; }
        } else if (project === 'temperature') {
            allowableError = 3; errorMessage = '烟气温度'; documentError = '绝对误差≤±3°C';
        } else if (project === 'oxygen') {
            if (onlineAverage > 5.0) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '含氧量 > 5%'; documentError = '相对误差≤15%'; } 
            else { allowableError = 1.0; errorMessage = '含氧量 ≤ 5%'; documentError = '绝对误差≤±1.0%'; }
        } else if (project === 'humidity') {
            if (onlineAverage > 5.0) { allowableErrorPercentage = 25; isRelativeError = true; errorMessage = '含湿量 > 5%'; documentError = '相对误差≤25%'; } 
            else { allowableError = 1.5; errorMessage = '含湿量 ≤ 5%'; documentError = '绝对误差≤±1.5%'; }
        } else if (project === 'particles') {
            if (onlineAverage >= 200) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '颗粒物 浓度≥200mg/m³'; documentError = '相对误差≤15%'; } 
            else if (onlineAverage >= 100) { allowableError = 2; errorMessage = '颗粒物 100mg/m³ ≤ 浓度 < 200mg/m³'; documentError = '绝对误差≤±2mg/m³'; } 
            else if (onlineAverage >= 50) { allowableErrorPercentage = 25; isRelativeError = true; errorMessage = '颗粒物 50mg/m³ ≤ 浓度 < 100mg/m³'; documentError = '相对误差≤25%'; } 
            else if (onlineAverage >= 20) { allowableErrorPercentage = 30; isRelativeError = true; errorMessage = '颗粒物 20mg/m³ ≤ 浓度 < 50mg/m³'; documentError = '相对误差≤30%'; } 
            else { allowableError = 6; errorMessage = '颗粒物 浓度 < 20mg/m³'; documentError = '绝对误差≤±6mg/m³'; }
        } else if (project === 'other_gas') {
            allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '其它气态污染物'; documentError = '相对误差≤15%';
        }
        
        let error = isRelativeError ? Math.abs((onlineAverage - personalMeasurement) / personalMeasurement) * 100 : Math.abs(onlineAverage - personalMeasurement);

        let output = `
            <strong>结果详情：</strong><br>
            在线测量平均值: ${onlineAverage.toFixed(5)}<br>
            本人测量值: ${personalMeasurement.toFixed(5)}<br>
            文档要求: ${documentError}<br>
            计算误差: ${isRelativeError ? error.toFixed(2) + '%' : error.toFixed(5)}<br>
            所属范围: ${errorMessage}<br>
        `;

        let isQualified = isRelativeError ? (error <= allowableErrorPercentage) : (error <= allowableError);
        output += isQualified ? `<span style="color: green; font-weight: bold;">合格</span>` : `<span style="color: red; font-weight: bold;">不合格</span>`;
        
        comparisonResultEl.innerHTML = output;
    });

});