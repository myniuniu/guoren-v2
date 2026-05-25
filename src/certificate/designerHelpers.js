/**
 * 设计器辅助工具集 (A6/A7/A8/B4/B5/B2/E2 等)
 * 全部以纯 JS 函数对外提供，避免与 React 渲染耦合。
 */
import * as fabric from 'fabric';
import QRCode from 'qrcode';

/* ------------------------------ A6 撤销/重做 ------------------------------ */
export function createHistoryStack(canvas, options = {}) {
  const max = options.max || 50;
  const stack = [];
  let cursor = -1;
  let suspended = false;

  const snapshot = () => {
    if (!canvas) return;
    if (suspended) return;
    const json = JSON.stringify(canvas.toJSON([
      'elementType', 'fieldKey', 'dynamicType', 'formatPattern',
      'qrSource', 'qrContent', 'errorCorrection', 'size',
      'seqRuleKey', 'locked', 'selectable', 'evented',
      'prefix', 'suffix', 'textTransform', 'padZero', 'numberFormat',
    ]));
    // 截掉 cursor 之后的分支
    if (cursor < stack.length - 1) stack.splice(cursor + 1);
    if (stack.length > 0 && stack[stack.length - 1] === json) return;
    stack.push(json);
    if (stack.length > max) stack.shift();
    cursor = stack.length - 1;
    options.onChange && options.onChange({ canUndo: cursor > 0, canRedo: false, size: stack.length });
  };

  const apply = (json) => {
    suspended = true;
    canvas.loadFromJSON(JSON.parse(json), () => {
      canvas.requestRenderAll();
      suspended = false;
      options.onChange && options.onChange({
        canUndo: cursor > 0,
        canRedo: cursor < stack.length - 1,
        size: stack.length,
      });
    });
  };

  const undo = () => {
    if (cursor <= 0) return;
    cursor--;
    apply(stack[cursor]);
  };
  const redo = () => {
    if (cursor >= stack.length - 1) return;
    cursor++;
    apply(stack[cursor]);
  };
  const reset = () => {
    stack.length = 0;
    cursor = -1;
  };
  const setSuspended = (v) => { suspended = !!v; };

  // 监听画布变更
  const onChange = () => snapshot();
  canvas.on('object:added', onChange);
  canvas.on('object:modified', onChange);
  canvas.on('object:removed', onChange);

  return {
    snapshot, undo, redo, reset, setSuspended,
    canUndo: () => cursor > 0,
    canRedo: () => cursor < stack.length - 1,
    dispose: () => {
      canvas.off('object:added', onChange);
      canvas.off('object:modified', onChange);
      canvas.off('object:removed', onChange);
    },
  };
}

/* ------------------------------ A8 对齐辅助线 + 吸附 ------------------------------ */
export function attachAlignmentGuideline(canvas, opts = {}) {
  const threshold = opts.threshold || 6;
  const lines = [];

  const clearLines = () => { lines.length = 0; canvas.requestRenderAll(); };

  const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.save();
    ctx.strokeStyle = opts.color || '#ff4d4f';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const onMoving = (e) => {
    const obj = e.target;
    if (!obj) return;
    lines.length = 0;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const objCx = obj.left + (obj.width * obj.scaleX) / 2;
    const objCy = obj.top + (obj.height * obj.scaleY) / 2;

    // 与画布中心对齐
    if (Math.abs(objCx - w / 2) < threshold) {
      obj.set({ left: w / 2 - (obj.width * obj.scaleX) / 2 });
      lines.push({ type: 'v', x: w / 2 });
    }
    if (Math.abs(objCy - h / 2) < threshold) {
      obj.set({ top: h / 2 - (obj.height * obj.scaleY) / 2 });
      lines.push({ type: 'h', y: h / 2 });
    }

    // 与其他对象对齐
    canvas.getObjects().forEach((other) => {
      if (other === obj) return;
      const oL = other.left;
      const oT = other.top;
      const oR = oL + other.width * other.scaleX;
      const oB = oT + other.height * other.scaleY;
      const cur = {
        L: obj.left,
        T: obj.top,
        R: obj.left + obj.width * obj.scaleX,
        B: obj.top + obj.height * obj.scaleY,
      };
      // 左/右
      if (Math.abs(cur.L - oL) < threshold) { obj.set({ left: oL }); lines.push({ type: 'v', x: oL }); }
      else if (Math.abs(cur.R - oR) < threshold) { obj.set({ left: oR - obj.width * obj.scaleX }); lines.push({ type: 'v', x: oR }); }
      // 上/下
      if (Math.abs(cur.T - oT) < threshold) { obj.set({ top: oT }); lines.push({ type: 'h', y: oT }); }
      else if (Math.abs(cur.B - oB) < threshold) { obj.set({ top: oB - obj.height * obj.scaleY }); lines.push({ type: 'h', y: oB }); }
    });
  };

  const onMouseUp = () => clearLines();

  const onAfterRender = () => {
    if (!lines.length) return;
    const ctx = canvas.getSelectionContext();
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    lines.forEach((l) => {
      if (l.type === 'v') drawLine(ctx, l.x, 0, l.x, h);
      else drawLine(ctx, 0, l.y, w, l.y);
    });
  };

  canvas.on('object:moving', onMoving);
  canvas.on('mouse:up', onMouseUp);
  canvas.on('after:render', onAfterRender);

  return () => {
    canvas.off('object:moving', onMoving);
    canvas.off('mouse:up', onMouseUp);
    canvas.off('after:render', onAfterRender);
  };
}

/* ------------------------------ B4 浅色网格背景 ------------------------------ */
export function attachGrid(canvas, opts = {}) {
  const size = opts.size || 20;
  const color = opts.color || 'rgba(0,0,0,0.06)';
  let visible = opts.visible !== false;

  const draw = () => {
    if (!visible) return;
    const ctx = canvas.getContext();
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let x = size; x < w; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = size; y < h; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
  };

  // 绘制顺序：先画背景图（已是 backgroundImage），然后是这层 grid，再到对象
  const handler = () => draw();
  canvas.on('after:render', handler);
  return {
    setVisible: (v) => { visible = !!v; canvas.requestRenderAll(); },
    isVisible: () => visible,
    dispose: () => canvas.off('after:render', handler),
  };
}

/* ------------------------------ B5 滚轮缩放 + 空格平移 ------------------------------ */
export function attachZoomPan(canvas, opts = {}) {
  const minZoom = opts.minZoom || 0.2;
  const maxZoom = opts.maxZoom || 4;
  let isPanning = false;
  let spaceDown = false;
  let lastPos = { x: 0, y: 0 };

  const onWheel = (opt) => {
    const e = opt.e;
    if (!e.ctrlKey && !e.metaKey) return; // Ctrl+滚轮 才缩放，避免误触
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** e.deltaY;
    if (zoom > maxZoom) zoom = maxZoom;
    if (zoom < minZoom) zoom = minZoom;
    canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
    e.preventDefault();
    e.stopPropagation();
    opts.onZoomChange && opts.onZoomChange(zoom);
  };

  const onMouseDown = (opt) => {
    const e = opt.e;
    if (spaceDown || e.button === 1) {
      isPanning = true;
      lastPos = { x: e.clientX, y: e.clientY };
      canvas.selection = false;
      canvas.setCursor('grabbing');
    }
  };
  const onMouseMove = (opt) => {
    if (!isPanning) return;
    const e = opt.e;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    lastPos = { x: e.clientX, y: e.clientY };
    const vpt = canvas.viewportTransform;
    vpt[4] += dx;
    vpt[5] += dy;
    canvas.requestRenderAll();
  };
  const onMouseUp = () => {
    if (isPanning) {
      isPanning = false;
      canvas.selection = true;
      canvas.setCursor(spaceDown ? 'grab' : 'default');
    }
  };

  const onKeyDown = (e) => {
    if (e.code === 'Space' && !spaceDown) {
      spaceDown = true;
      canvas.defaultCursor = 'grab';
      canvas.setCursor('grab');
    }
  };
  const onKeyUp = (e) => {
    if (e.code === 'Space') {
      spaceDown = false;
      canvas.defaultCursor = 'default';
      canvas.setCursor('default');
    }
  };

  canvas.on('mouse:wheel', onWheel);
  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    setZoom: (z) => {
      const cx = canvas.getWidth() / 2;
      const cy = canvas.getHeight() / 2;
      canvas.zoomToPoint({ x: cx, y: cy }, Math.min(maxZoom, Math.max(minZoom, z)));
      opts.onZoomChange && opts.onZoomChange(canvas.getZoom());
    },
    fit: () => {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      opts.onZoomChange && opts.onZoomChange(1);
    },
    dispose: () => {
      canvas.off('mouse:wheel', onWheel);
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}

/* ------------------------------ A5 预览模式切换 ------------------------------ */
export function setPreviewMode(canvas, isPreview) {
  canvas.getObjects().forEach((o) => {
    if (isPreview) {
      o._origSelectable = o.selectable;
      o._origEvented = o.evented;
      o.selectable = false;
      o.evented = false;
    } else {
      o.selectable = o._origSelectable !== false;
      o.evented = o._origEvented !== false;
    }
  });
  canvas.discardActiveObject();
  canvas.selection = !isPreview;
  canvas.requestRenderAll();
}

/* ------------------------------ A4 字段锁定 ------------------------------ */
export function setObjectLocked(obj, locked) {
  if (!obj) return;
  obj.locked = !!locked;
  obj.lockMovementX = !!locked;
  obj.lockMovementY = !!locked;
  obj.lockScalingX = !!locked;
  obj.lockScalingY = !!locked;
  obj.lockRotation = !!locked;
  obj.hasControls = !locked;
  obj.evented = true;
}

/* ------------------------------ A7 层级管理 ------------------------------ */
export function bringForward(canvas, obj) { if (obj) canvas.bringObjectForward(obj); }
export function sendBackward(canvas, obj) { if (obj) canvas.sendObjectBackwards(obj); }
export function bringToFront(canvas, obj) { if (obj) canvas.bringObjectToFront(obj); }
export function sendToBack(canvas, obj) { if (obj) canvas.sendObjectToBack(obj); }

/* ------------------------------ E2 二维码生成（前端预览） ------------------------------ */
export async function generateQrDataURL(content, size = 200, errorCorrection = 'M') {
  if (!content) return '';
  return await QRCode.toDataURL(String(content), {
    errorCorrectionLevel: errorCorrection,
    margin: 1,
    width: size,
  });
}

/** 在画布上插入一个二维码图片（带扩展属性以便后端识别） */
export async function insertQrCode(canvas, opts = {}) {
  const size = opts.size || 160;
  const ec = opts.errorCorrection || 'M';
  const content = opts.content || 'https://example.com';
  const dataUrl = await generateQrDataURL(content, size, ec);
  const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
  img.set({ left: opts.left ?? 200, top: opts.top ?? 200 });
  img.elementType = 'qrcode';
  img.qrSource = opts.source || 'static';
  img.qrContent = content;
  img.errorCorrection = ec;
  img.fieldKey = opts.fieldKey || '';
  img.size = size;
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

/** 二维码内容/尺寸/容错变化时同步重绘 */
export async function refreshQrCode(canvas, obj) {
  if (!obj || obj.elementType !== 'qrcode') return;
  const dataUrl = await generateQrDataURL(obj.qrContent || '', obj.size || 160, obj.errorCorrection || 'M');
  const newImg = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
  obj.setElement(newImg.getElement());
  canvas.requestRenderAll();
}

/* ------------------------------ B2 字体动态加载 ------------------------------ */
const loadedFonts = new Set();
export async function loadFont(family) {
  if (!family || loadedFonts.has(family)) return true;
  if (typeof document === 'undefined' || !document.fonts) {
    loadedFonts.add(family);
    return true;
  }
  try {
    await document.fonts.load(`16px "${family}"`);
    loadedFonts.add(family);
    return true;
  } catch (e) {
    console.warn('字体加载失败:', family, e);
    return false;
  }
}

/* ------------------------------ C4 模版数据校验 ------------------------------ */
export function validateTemplate({ width, height, fields, canvasJson, name }) {
  const errors = [];
  if (!name || !name.trim()) errors.push('请填写模版名称');
  if (!width || width < 100) errors.push('画布宽度必须 ≥ 100');
  if (!height || height < 100) errors.push('画布高度必须 ≥ 100');
  // 字段校验
  const seen = new Set();
  (fields || []).forEach((f, i) => {
    if (!f.key || !f.key.trim()) errors.push(`第 ${i + 1} 个字段缺少 key`);
    else if (seen.has(f.key)) errors.push(`字段 key 重复: ${f.key}`);
    else seen.add(f.key);
  });
  // 引用字段是否存在
  if (canvasJson && Array.isArray(canvasJson.objects)) {
    canvasJson.objects.forEach((o) => {
      if (o.elementType === 'field' && o.fieldKey && !seen.has(o.fieldKey)) {
        errors.push(`引用了不存在的字段: ${o.fieldKey}`);
      }
    });
  }
  return errors;
}
