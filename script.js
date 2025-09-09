document.addEventListener('DOMContentLoaded', function() {
  // --- DOM 元素获取 ---
  const projectSelect = document.getElementById('project');
  const comparisonToolDiv = document.getElementById('comparisonTool');
  const conversionToolDiv = document.getElementById('conversionTool');
  const ocrToolDiv = document.getElementById('ocrTool');

  // 比对工具
  const measurementForm = document.getElementById('measurementForm');
  const comparisonResultEl = document.getElementById('comparisonResult');
  const onlineBulk = document.getElementById('onlineBulk');
  const inlineOcrFile = document.getElementById('inlineOcrFile');
  const inlineOcrStatus = document.getElementById('inlineOcrStatus');
  const inlineOcrBar = document.getElementById('inlineOcrBar');
  // 【新增】获取内嵌OCR的拖拽区域
  const inlineOcrDropZone = document.querySelector('#inlineOcr .drop');

  // 烟气折算
  const noxConversionForm = document.getElementById('noxConversionForm');
  const standardOxygenInput = document.getElementById('standardOxygen');
  const measuredOxygenInput = document.getElementById('measuredOxygen');
  const measuredValueInput = document.getElementById('measuredValue');
  const noxResultEl = document.getElementById('noxResult');

  // 约分
  const roundingForm = document.getElementById('roundingForm');
  const roundingInput = document.getElementById('roundingInput');
  const roundingResultEl = document.getElementById('roundingResult');

  // 独立 OCR 页
  const ocrDrop = document.getElementById('ocrDrop');
  const ocrFile = document.getElementById('ocrFile');
  const ocrPsm = document.getElementById('ocrPsm');
  const ocrBar = document.getElementById('ocrBar');
  const ocrStatus = document.getElementById('ocrStatus');
  const ocrNums = document.getElementById('ocrNums');
  const ocrRaw = document.getElementById('ocrRaw');

  // --- 切换工具（合并为唯一一处） ---
  projectSelect.addEventListener('change', function() {
    // 清空结果
    comparisonResultEl.innerHTML = '';
    roundingResultEl.innerHTML = '';
    noxResultEl.innerHTML = '';

    // 清空输入
    document.querySelectorAll('input[type="number"], input[type="text"]').forEach(i => i.value = '');
    if (onlineBulk) onlineBulk.value = '';
    if (inlineOcrStatus) inlineOcrStatus.textContent = '';
    if (inlineOcrBar) inlineOcrBar.style.width = '0%';
    if (ocrStatus) ocrStatus.textContent = '';
    if (ocrBar) ocrBar.style.width = '0%';
    if (ocrNums) ocrNums.textContent = '（等待识别）';
    if (ocrRaw) ocrRaw.textContent = '';

    // 显隐
    const v = projectSelect.value;
    comparisonToolDiv.style.display = (v === 'conversion' || v === 'ocr') ? 'none' : 'block';
    conversionToolDiv.style.display  = (v === 'conversion') ? 'block' : 'none';
    ocrToolDiv.style.display         = (v === 'ocr') ? 'block' : 'none';
  });
  // 初始化一次
  ocrToolDiv.style.display = (projectSelect.value === 'ocr') ? 'block' : 'none';
  comparisonToolDiv.style.display = (projectSelect.value === 'conversion' || projectSelect.value === 'ocr') ? 'none' : 'block';
  conversionToolDiv.style.display = (projectSelect.value === 'conversion') ? 'block' : 'none';

  // --- 公共：数字解析 ---
  const NUM_RE = /-?\d+(?:[,\s]\d{3})*(?:\.\d+)?/g;
  const norm = s => s.replace(/\s+/g, '').replace(/,/g, '');
  function parseNumbersFromText(t) {
    if (!t) return [];
    const fixed = t.replace(/，/g, ',').replace(/。/g, '.');
    const hits = fixed.match(NUM_RE) || [];
    return hits.map(norm).map(parseFloat).filter(v => !isNaN(v));
  }

  // --- 公共：图像预处理（一次定义） ---
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }
  function drawScaledCanvas(img, minW = 800) {
    const scale = Math.max(1, Math.ceil(minW / img.naturalWidth));
    const c = document.createElement('canvas');
    c.width = img.naturalWidth * scale;
    c.height = img.naturalHeight * scale;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  function otsuBinarizeCanvas(cin, invert = false) {
    const w = cin.width, h = cin.height;
    const ctxIn = cin.getContext('2d');
    const src = ctxIn.getImageData(0, 0, w, h).data;

    const hist = new Array(256).fill(0);
    const gray = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < src.length; i += 4, j++) {
      const g = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
      gray[j] = g; hist[g]++;
    }
    let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
    const total = gray.length;
    let sumB = 0, wB = 0, varMax = 0, th = 127;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) ** 2;
      if (between > varMax) { varMax = between; th = t; }
    }
    const cout = document.createElement('canvas');
    cout.width = w; cout.height = h;
    const out = cout.getContext('2d').createImageData(w, h);
    for (let j = 0, i = 0; j < gray.length; j++, i += 4) {
      let v = gray[j] > th ? 255 : 0;
      if (invert) v = 255 - v;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
    cout.getContext('2d').putImageData(out, 0, 0);
    return cout;
  }
  function makeVariants(imgOrCanvas) {
    const base = imgOrCanvas instanceof HTMLCanvasElement ? imgOrCanvas : drawScaledCanvas(imgOrCanvas, 800);
    const bin  = otsuBinarizeCanvas(base, false);
    const binI = otsuBinarizeCanvas(base, true);
    return [base, bin, binI];
  }

  // --- OCR Worker（统一一个，logger 同时更新两处 UI） ---
  let ocrWorkerPromise = null;
  async function getOcrWorker() {
    if (!window.Tesseract) {
      alert('Tesseract.js 未加载，请检查 index.html 中的 CDN 引入。');
      throw new Error('Tesseract.js not loaded');
    }
    if (!ocrWorkerPromise) {
      ocrWorkerPromise = window.Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (!m || typeof m.progress !== 'number') return;
          const pct = Math.round(m.progress * 100);
          if (inlineOcrStatus && inlineOcrBar) {
            inlineOcrStatus.textContent = `${m.status} ${pct}%`;
            inlineOcrBar.style.width = `${pct}%`;
          }
          if (ocrStatus && ocrBar) {
            ocrStatus.textContent = `${m.status} ${pct}%`;
            ocrBar.style.width = `${pct}%`;
          }
        }
      });
    }
    return await ocrWorkerPromise;
  }

  // --- 内嵌 OCR：识别后把数字写入批量文本框 ---
  async function runInlineOCR(file) {
    inlineOcrStatus.textContent = `识别中：${file.name}...`;
    inlineOcrBar.style.width = '0%';

    const worker = await getOcrWorker();
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.,-',
      preserve_interword_spaces: '1'
    });

    const img = await loadImageFromFile(file);
    const variants = makeVariants(img);
    const psms = [6, 4, 3, 7, 11];

    let best = { nums: [] }, steps = psms.length * variants.length, done = 0;
    for (const p of psms) {
      await worker.setParameters({ tessedit_pageseg_mode: String(p) });
      for (let i = 0; i < variants.length; i++) {
        const { data: { text } } = await worker.recognize(variants[i]);
        const hits = (text || '').replace(/，/g, ',').replace(/。/g, '.').match(NUM_RE) || [];
        if (hits.length > (best.nums?.length || 0)) best = { nums: hits };
        done++; inlineOcrBar.style.width = `${Math.round(done / steps * 100)}%`;
      }
    }

    const normalized = best.nums.map(norm);
    if (normalized.length) {
      const toWrite = normalized.join('\n');
      onlineBulk.value = onlineBulk.value.trim()
        ? (onlineBulk.value.trim() + '\n' + toWrite)
        : toWrite;
      inlineOcrStatus.textContent = `文件[${file.name}]已识别 ${normalized.length} 个数字，并填入文本框`;
    } else {
      inlineOcrStatus.textContent = `文件[${file.name}]未识别到数字`;
    }
    inlineOcrBar.style.width = '100%';
  }

  // 【修改】重写内嵌OCR的文件处理逻辑以支持多文件
  const handleInlineOcrFiles = async (files) => {
    if (!files || files.length === 0) return;

    inlineOcrFile.disabled = true; // 禁用文件输入，防止处理时再次选择

    // 遍历所有文件并依次进行OCR识别
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            await runInlineOCR(file); // 使用await确保文件按顺序处理
        }
    }

    inlineOcrStatus.textContent = '所有图片处理完毕。';
    inlineOcrFile.disabled = false; // 处理完毕后重新启用
  };

  // 绑定“选择文件”按钮的 change 事件
  inlineOcrFile?.addEventListener('change', (e) => {
      handleInlineOcrFiles(e.target.files);
      // 清空当前值，以便能再次选择相同的文件
      e.target.value = null;
  });

  // 【新增】为内嵌OCR区域添加拖拽上传功能
  if (inlineOcrDropZone) {
      ['dragenter', 'dragover'].forEach(eventName => {
          inlineOcrDropZone.addEventListener(eventName, (e) => {
              e.preventDefault();
              inlineOcrDropZone.style.background = '#f0f8ff'; // 高亮背景
              inlineOcrDropZone.style.borderColor = '#007BFF'; // 高亮边框
          });
      });

      ['dragleave', 'drop'].forEach(eventName => {
          inlineOcrDropZone.addEventListener(eventName, (e) => {
              e.preventDefault();
              inlineOcrDropZone.style.background = ''; // 恢复背景
              inlineOcrDropZone.style.borderColor = ''; // 恢复边框
          });
      });

      inlineOcrDropZone.addEventListener('drop', (e) => {
          handleInlineOcrFiles(e.dataTransfer.files);
      });
  }

  // --- 独立 OCR 页：增强版 runOCR ---
  async function runOCR(fileOrCanvas) {
    ocrBar.style.width = '0%';
    ocrStatus.textContent = '加载中…';
    ocrNums.textContent = '识别中…';
    ocrRaw.textContent = '';

    const worker = await getOcrWorker();
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.,-',
      preserve_interword_spaces: '1'
    });

    let variants = [];
    if (fileOrCanvas instanceof HTMLCanvasElement) {
      variants = makeVariants(fileOrCanvas);
    } else {
      const img = await loadImageFromFile(fileOrCanvas);
      variants = makeVariants(img);
    }

    const psms = [6, 4, 3, 7, 11];
    let best = { nums: [], text: '', psm: null, varIdx: null };
    let steps = psms.length * variants.length, done = 0;

    for (const p of psms) {
      await worker.setParameters({ tessedit_pageseg_mode: String(p) });
      for (let i = 0; i < variants.length; i++) {
        const { data: { text } } = await worker.recognize(variants[i]);
        const fixed = (text || '').replace(/，/g, ',').replace(/。/g, '.');
        const nums = (fixed.match(NUM_RE) || []).map(norm);

        if (nums.length > best.nums.length || (nums.length === best.nums.length && (text || '').length > (best.text || '').length)) {
          best = { nums, text, psm: p, varIdx: i };
        }
        done++;
        const prog = Math.round((done / steps) * 100);
        ocrStatus.textContent = `识别中… ${prog}%（PSM=${p} 变体#${i}）`;
        ocrBar.style.width = `${prog}%`;
      }
    }

    ocrRaw.textContent = best.text || '';
    ocrNums.textContent = best.nums.length ? JSON.stringify(best.nums) : '未识别到数字';
    ocrStatus.textContent = `完成（PSM=${best.psm} 变体#${best.varIdx}）`;
    ocrBar.style.width = '100%';
  }
  // 绑定独立 OCR 的文件选择/拖拽
  ocrFile?.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (f) runOCR(f);
  });
  ['dragenter','dragover'].forEach(evt =>
    ocrDrop?.addEventListener(evt, e => { e.preventDefault(); ocrDrop.style.background = '#fafafa'; })
  );
  ['dragleave','drop'].forEach(evt =>
    ocrDrop?.addEventListener(evt, e => { e.preventDefault(); ocrDrop.style.background = ''; })
  );
  ocrDrop?.addEventListener('drop', e => {
    const f = e.dataTransfer.files?.[0];
    if (f) runOCR(f);
  });

  // --- 烟气折算（批量） ---
  noxConversionForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const stdO2 = parseFloat(standardOxygenInput.value);
    const meaO2Array = measuredOxygenInput.value.split('/').map(s => s.trim()).filter(Boolean).map(parseFloat);
    const meaValArray = measuredValueInput.value.split('/').map(s => s.trim()).filter(Boolean).map(parseFloat);

    if (isNaN(stdO2)) { noxResultEl.innerHTML = `<span style="color:red;">请输入有效的“基准氧含量”！</span>`; return; }
    if (!meaO2Array.length || !meaValArray.length) { noxResultEl.innerHTML = `<span style="color:red;">“实测氧含量”和“实测数值”不能为空！</span>`; return; }
    if (meaO2Array.length !== meaValArray.length) { noxResultEl.innerHTML = `<span style="color:red;">错误：“实测氧含量”个数与“实测数值”个数必须一一对应！</span>`; return; }
    if (meaO2Array.some(isNaN) || meaValArray.some(isNaN)) { noxResultEl.innerHTML = `<span style="color:red;">错误：请确保所有输入都是有效数字，并用 '/' 隔开。</span>`; return; }

    let outputHtml = '<strong>批量计算结果：</strong><br><ol style="text-align:left;margin-top:10px;">';
    let hasError = false;
    for (let i = 0; i < meaO2Array.length; i++) {
      const curO2 = meaO2Array[i], curVal = meaValArray[i];
      if (21 - curO2 === 0) { outputHtml += `<li>第 ${i+1} 组: <span style="color:red;">错误！实测氧含量不能为21。</span></li>`; hasError = true; continue; }
      const result = (21 - stdO2) / (21 - curO2) * curVal;
      outputHtml += `<li>第 ${i+1} 组结果: <strong style="color:#0056b3;">${result.toFixed(5)}</strong></li>`;
    }
    outputHtml += '</ol>';
    if (hasError) outputHtml += '<p style="color:red;font-size:14px;text-align:center;">已跳过计算中出错的项目。</p>';
    noxResultEl.innerHTML = outputHtml;
  });

  // --- 约分（四舍六入五成双） ---
  function roundHalfToEven(value) {
    const decimal = value % 1;
    if (Math.abs(decimal) === 0.5) {
      const integerPart = Math.floor(Math.abs(value));
      return (integerPart % 2 === 0) ? Math.trunc(value) : Math.round(value);
    }
    return Math.round(value);
  }
  roundingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const value = parseFloat(roundingInput.value);
    if (isNaN(value)) { roundingResultEl.innerHTML = `<span style="color:red;">请输入一个有效的数字！</span>`; return; }
    const result = roundHalfToEven(value);
    roundingResultEl.innerHTML = `输入值: ${value}<br><strong>修约后结果: ${result}</strong>`;
  });

  // --- 测量比对（文本框优先，否则用1~5已填项） ---
  measurementForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const project = projectSelect.value;
    const personalMeasurement = parseFloat(document.getElementById('personal').value);

    const typedOnline = [
      parseFloat(document.getElementById('online1').value),
      parseFloat(document.getElementById('online2').value),
      parseFloat(document.getElementById('online3').value),
      parseFloat(document.getElementById('online4').value),
      parseFloat(document.getElementById('online5').value),
    ].filter(v => !isNaN(v));

    const bulkNums = parseNumbersFromText(onlineBulk.value);

    if (isNaN(personalMeasurement)) {
      comparisonResultEl.innerHTML = `<span style="color:red;">请输入“本人测量”。</span>`;
      return;
    }

    let onlineAverage = null;
    if (bulkNums.length > 0) {
      onlineAverage = bulkNums.reduce((a,b)=>a+b,0) / bulkNums.length;
    } else if (typedOnline.length > 0) {
      onlineAverage = typedOnline.reduce((a,b)=>a+b,0) / typedOnline.length;
    } else {
      comparisonResultEl.innerHTML = `<span style="color:red;">请在“在线测量 1~5”任意一个或“批量文本框”里输入至少一个数字。</span>`;
      return;
    }

    // —— 分档（与你原逻辑一致）——
    const ref = personalMeasurement;
    let allowableErrorPercentage = 0, allowableError = 0;
    let errorMessage = '', documentError = '';
    let isRelativeError = false;

    if (project === 'so2') {
      if (ref >= 715) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '二氧化硫 浓度≥715mg/m³'; documentError = '相对误差≤15%'; }
      else if (ref >= 143) { allowableError = 57; errorMessage = '二氧化硫 143mg/m³ ≤ 浓度 < 715mg/m³'; documentError = '绝对误差≤±57mg/m³'; }
      else if (ref >= 57)  { allowableErrorPercentage = 30; isRelativeError = true; errorMessage = '二氧化硫 57mg/m³ ≤ 浓度 < 143mg/m³'; documentError = '相对误差≤±30%'; }
      else { allowableError = 17; errorMessage = '二氧化硫 浓度 < 57mg/m³'; documentError = '绝对误差≤±17mg/m³'; }
    } else if (project === 'no2') {
      if (ref >= 513) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '氮氧化物 浓度≥513mg/m³'; documentError = '相对误差≤15%'; }
      else if (ref >= 103) { allowableError = 41; errorMessage = '氮氧化物 103mg/m³ ≤ 浓度 < 513mg/m³'; documentError = '绝对误差≤±41mg/m³'; }
      else if (ref >= 41)  { allowableErrorPercentage = 30; isRelativeError = true; errorMessage = '氮氧化物 41mg/m³ ≤ 浓度 < 103mg/m³'; documentError = '相对误差≤±30%'; }
      else { allowableError = 12; errorMessage = '氮氧化物 浓度 < 41mg/m³'; documentError = '绝对误差≤±12mg/m³'; }
    } else if (project === 'flow_rate') {
      if (ref > 10) { allowableErrorPercentage = 10; isRelativeError = true; errorMessage = '烟气流速 > 10m/s'; documentError = '相对误差≤10%'; }
      else { allowableErrorPercentage = 12; isRelativeError = true; errorMessage = '烟气流速 ≤ 10m/s'; documentError = '相对误差≤12%'; }
    } else if (project === 'temperature') {
      allowableError = 3; errorMessage = '烟气温度'; documentError = '绝对误差≤±3°C';
    } else if (project === 'oxygen') {
      if (ref > 5.0) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '含氧量 > 5%'; documentError = '相对误差≤15%'; }
      else { allowableError = 1.0; errorMessage = '含氧量 ≤ 5%'; documentError = '绝对误差≤±1.0%'; }
    } else if (project === 'humidity') {
      if (ref > 5.0) { allowableErrorPercentage = 25; isRelativeError = true; errorMessage = '含湿量 > 5%'; documentError = '相对误差≤25%'; }
      else { allowableError = 1.5; errorMessage = '含湿量 ≤ 5%'; documentError = '绝对误差≤±1.5%'; }
    } else if (project === 'particles') {
      if (ref >= 200) { allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '颗粒物 浓度≥200mg/m³'; documentError = '相对误差≤15%'; }
      else if (ref >= 100) { allowableError = 2;  errorMessage = '颗粒物 100mg/m³ ≤ 浓度 < 200mg/m³'; documentError = '绝对误差≤±2mg/m³'; }
      else if (ref >= 50)  { allowableErrorPercentage = 25; isRelativeError = true; errorMessage = '颗粒物 50mg/m³ ≤ 浓度 < 100mg/m³'; documentError = '相对误差≤25%'; }
      else if (ref >= 20)  { allowableErrorPercentage = 30; isRelativeError = true; errorMessage = '颗粒物 20mg/m³ ≤ 浓度 < 50mg/m³'; documentError = '相对误差≤30%'; }
      else { allowableError = 6; errorMessage = '颗粒物 浓度 < 20mg/m³'; documentError = '绝对误差≤±6mg/m³'; }
    } else if (project === 'other_gas') {
      allowableErrorPercentage = 15; isRelativeError = true; errorMessage = '其它气态污染物'; documentError = '相对误差≤15%';
    }

    if (isRelativeError && personalMeasurement === 0) {
      comparisonResultEl.innerHTML = `<span style="color:red;">个人测量值为 0，无法计算相对误差。</span>`;
      return;
    }

    const error = isRelativeError
      ? Math.abs((onlineAverage - personalMeasurement) / personalMeasurement) * 100
      : Math.abs(onlineAverage - personalMeasurement);

    let output = `
      <strong>结果详情：</strong><br>
      在线测量平均值: ${onlineAverage.toFixed(5)}<br>
      本人测量值: ${personalMeasurement.toFixed(5)}<br>
      文档要求: ${documentError}<br>
      计算误差: ${isRelativeError ? error.toFixed(2) + '%' : error.toFixed(5)}<br>
      所属范围: ${errorMessage}<br>
    `;
    const isQualified = isRelativeError ? (error <= allowableErrorPercentage) : (error <= allowableError);
    output += isQualified
      ? `<span style="color:green;font-weight:bold;">合格</span>`
      : `<span style="color:red;font-weight:bold;">不合格</span>`;
    comparisonResultEl.innerHTML = output;
  });

});